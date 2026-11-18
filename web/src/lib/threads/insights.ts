import { getFollowersCount, getMediaInsights, getUserRangeInsights } from "@/lib/threads/api";
import { THREADS_PROJECT_LABEL, type ThreadsProject } from "@/lib/threads/projects";
import { getUsableCredentials, threadsDb } from "@/lib/threads/store";
import { startOfTaipeiDay, taipeiDateString } from "@/lib/time/taipei";

/** 發出後幾天內持續更新成效；超過就不再更新（039） */
const INSIGHTS_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
/** 統計只算工作室帳號時期的貼文（之前 28 篇是 Vigo 舊文案，沒有成效數據） */
const STUDIO_START = "2026-11-17T00:00:00+08:00";

export type InsightsRefreshResult = {
  ok: boolean;
  postsUpdated: number;
  postsFailed: number;
  account: "ok" | "failed" | "skipped";
  error?: string;
};

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 更新成效：發出 7 天內的貼文各打一次 media insights；帳號層級存今天的粉絲數、
 * 昨天整天的個人檔案瀏覽與連結點擊。需要 threads_manage_insights 權限，
 * 沒權限時錯誤會記在 insights_error / threads_account_daily.error，不影響發文。
 */
export async function refreshThreadsInsights(): Promise<InsightsRefreshResult> {
  const db = threadsDb();
  if (!db) return { ok: false, postsUpdated: 0, postsFailed: 0, account: "skipped", error: "伺服器缺少 SUPABASE_SERVICE_ROLE_KEY" };

  let credentials: { token: string; userId: string };
  try {
    credentials = await getUsableCredentials();
  } catch (error) {
    return { ok: false, postsUpdated: 0, postsFailed: 0, account: "skipped", error: errorText(error) };
  }

  const { data: posts, error: listError } = await db
    .from("threads_posts")
    .select("id, threads_media_id")
    .eq("status", "posted")
    .not("threads_media_id", "is", null)
    .gte("posted_at", new Date(Date.now() - INSIGHTS_DAYS * DAY_MS).toISOString());
  if (listError) return { ok: false, postsUpdated: 0, postsFailed: 0, account: "skipped", error: listError.message };

  const now = new Date().toISOString();
  const results = await Promise.all(
    (posts ?? []).map(async (post) => {
      try {
        const insights = await getMediaInsights(credentials.token, String(post.threads_media_id));
        await db
          .from("threads_posts")
          .update({ ...insights, insights_updated_at: now, insights_error: null })
          .eq("id", post.id);
        return true;
      } catch (error) {
        await db.from("threads_posts").update({ insights_error: errorText(error) }).eq("id", post.id);
        return false;
      }
    }),
  );
  const postsUpdated = results.filter(Boolean).length;
  const postsFailed = results.length - postsUpdated;

  // 帳號層級：今天的粉絲數快照、昨天整天的瀏覽與點擊
  let account: InsightsRefreshResult["account"] = "ok";
  let accountError: string | undefined;
  const today = taipeiDateString(new Date());
  const todayStart = startOfTaipeiDay(today);
  const yesterday = taipeiDateString(new Date(todayStart.getTime() - DAY_MS));
  try {
    const followers = await getFollowersCount(credentials.token, credentials.userId);
    await db
      .from("threads_account_daily")
      .upsert({ day: today, followers_count: followers, error: null, updated_at: now }, { onConflict: "day" });
    const range = await getUserRangeInsights(
      credentials.token,
      credentials.userId,
      Math.floor(startOfTaipeiDay(yesterday).getTime() / 1000),
      Math.floor(todayStart.getTime() / 1000),
    );
    await db
      .from("threads_account_daily")
      .upsert(
        { day: yesterday, profile_views: range.views, link_clicks: range.clicks, error: null, updated_at: now },
        { onConflict: "day" },
      );
  } catch (error) {
    account = "failed";
    accountError = errorText(error);
    await db
      .from("threads_account_daily")
      .upsert({ day: today, error: accountError, updated_at: now }, { onConflict: "day" });
  }

  const ok = postsFailed === 0 && account === "ok";
  return {
    ok,
    postsUpdated,
    postsFailed,
    account,
    ...(ok ? {} : { error: accountError ?? "部分貼文成效更新失敗，原因記在 insights_error" }),
  };
}

export type ThreadsPostStat = {
  id: string;
  project: ThreadsProject;
  projectLabel: string;
  style: string | null;
  postedAt: string;
  permalink: string | null;
  bodyPreview: string;
  views: number | null;
  likes: number | null;
  replies: number | null;
  reposts: number | null;
  quotes: number | null;
  shares: number | null;
  interactions: number | null;
  engagementRate: number | null;
  insightsUpdatedAt: string | null;
  insightsError: string | null;
};

export type ThreadsGroupStat = {
  key: string;
  posts: number;
  postsWithViews: number;
  medianViews: number | null;
  medianEngagementRate: number | null;
};

export type ThreadsAccountDay = {
  day: string;
  followers_count: number | null;
  profile_views: number | null;
  link_clicks: number | null;
  error: string | null;
};

export type ThreadsStats = {
  generatedAt: string;
  posts: ThreadsPostStat[];
  byStyle: ThreadsGroupStat[];
  byProject: ThreadsGroupStat[];
  account: ThreadsAccountDay[];
  error?: string;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function groupStats(posts: ThreadsPostStat[], keyOf: (p: ThreadsPostStat) => string): ThreadsGroupStat[] {
  const groups = new Map<string, ThreadsPostStat[]>();
  for (const post of posts) {
    const key = keyOf(post);
    groups.set(key, [...(groups.get(key) ?? []), post]);
  }
  return [...groups.entries()]
    .map(([key, items]) => {
      const withViews = items.filter((p) => p.views !== null && p.views > 0);
      return {
        key,
        posts: items.length,
        postsWithViews: withViews.length,
        medianViews: median(withViews.map((p) => p.views as number)),
        medianEngagementRate: median(
          withViews.filter((p) => p.engagementRate !== null).map((p) => p.engagementRate as number),
        ),
      };
    })
    .sort((a, b) => b.posts - a.posts);
}

/** 後台統計與 stats.json 共用：工作室帳號時期（2026-11-17 起）所有已發出的貼文 */
export async function getThreadsStats(): Promise<ThreadsStats> {
  const generatedAt = new Date().toISOString();
  const empty = { generatedAt, posts: [], byStyle: [], byProject: [], account: [] };
  const db = threadsDb();
  if (!db) return { ...empty, error: "伺服器缺少 SUPABASE_SERVICE_ROLE_KEY" };

  const { data, error } = await db
    .from("threads_posts")
    .select(
      "id, project, style, body, posted_at, threads_permalink, views, likes, replies, reposts, quotes, shares, insights_updated_at, insights_error",
    )
    .eq("status", "posted")
    .gte("posted_at", new Date(STUDIO_START).toISOString())
    .order("posted_at", { ascending: false })
    .limit(500);
  if (error) {
    const hint = error.message.includes("views")
      ? "資料庫尚未更新，請執行 039_threads_insights.sql"
      : error.message;
    return { ...empty, error: hint };
  }

  const posts: ThreadsPostStat[] = (data ?? []).map((row) => {
    const n = (v: unknown) => (typeof v === "number" ? v : null);
    const views = n(row.views);
    const parts = [n(row.likes), n(row.replies), n(row.reposts), n(row.quotes)];
    const interactions = parts.every((v) => v === null) ? null : parts.reduce<number>((s, v) => s + (v ?? 0), 0);
    const project = row.project as ThreadsProject;
    return {
      id: String(row.id),
      project,
      projectLabel: THREADS_PROJECT_LABEL[project] ?? String(row.project),
      style: (row.style as string | null) ?? null,
      postedAt: String(row.posted_at),
      permalink: (row.threads_permalink as string | null) ?? null,
      bodyPreview: String(row.body ?? "").replace(/\s+/g, " ").slice(0, 40),
      views,
      likes: n(row.likes),
      replies: n(row.replies),
      reposts: n(row.reposts),
      quotes: n(row.quotes),
      shares: n(row.shares),
      interactions,
      engagementRate: views && interactions !== null ? interactions / views : null,
      insightsUpdatedAt: (row.insights_updated_at as string | null) ?? null,
      insightsError: (row.insights_error as string | null) ?? null,
    };
  });

  const { data: accountRows } = await db
    .from("threads_account_daily")
    .select("day, followers_count, profile_views, link_clicks, error")
    .order("day", { ascending: false })
    .limit(60);

  return {
    generatedAt,
    posts,
    byStyle: groupStats(posts, (p) => p.style ?? "（未標）"),
    byProject: groupStats(posts, (p) => p.projectLabel),
    account: (accountRows ?? []) as ThreadsAccountDay[],
  };
}

