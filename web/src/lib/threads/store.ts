import { createClient } from "@supabase/supabase-js";
import {
  exchangeForLongLivedToken,
  getPermalink,
  getThreadsMe,
  publishTextPost,
  refreshLongLivedToken,
  ThreadsApiError,
} from "@/lib/threads/api";
import {
  containsLink,
  LINK_POST_WINDOW,
  THREADS_PROJECT_LABEL,
  type ThreadsProject,
} from "@/lib/threads/projects";
import { startOfTaipeiDay, taipeiDateString } from "@/lib/time/taipei";

/** 只在伺服器用；兩張表沒有 RLS policy，只有 service role 讀得到（見 033） */
export function threadsDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type ThreadsPostStatus = "draft" | "approved" | "posting" | "posted" | "failed";

export type ThreadsPost = {
  id: string;
  body: string;
  first_reply: string | null;
  style: string | null;
  project: ThreadsProject;
  status: ThreadsPostStatus;
  sort_order: number;
  threads_permalink: string | null;
  posted_at: string | null;
  last_error: string | null;
  created_at: string;
};

export type ThreadsConnection = {
  connected: boolean;
  username: string | null;
  expiresAt: string | null;
};

const POST_FIELDS_LEGACY =
  "id, body, first_reply, style, status, sort_order, threads_permalink, posted_at, last_error, created_at";
const POST_FIELDS = `${POST_FIELDS_LEGACY}, project`;

/** 038 還沒執行時，資料庫沒有 project 欄位；這時退回舊查法，全部當作 Vigo */
function isMissingProjectColumn(error: { message: string } | null): boolean {
  return !!error && error.message.includes("project");
}

/** 防封：兩篇之間至少隔這麼久（Cron 台北 12 點、21 點各一次，留一點誤差） */
const MIN_HOURS_BETWEEN_POSTS = 6;
/** 防封：台北同一天最多發幾篇（手動「現在發」也算） */
const MAX_POSTS_PER_DAY = 2;

function requireDb() {
  const db = threadsDb();
  if (!db) throw new Error("伺服器缺少 SUPABASE_SERVICE_ROLE_KEY");
  return db;
}

export async function listThreadsPosts(): Promise<{ posts: ThreadsPost[]; error?: string }> {
  const db = threadsDb();
  if (!db) return { posts: [], error: "伺服器缺少 SUPABASE_SERVICE_ROLE_KEY" };
  const query = (fields: string) =>
    db
      .from("threads_posts")
      .select(fields)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(300);
  const first = await query(POST_FIELDS);
  let rows: unknown[] = first.data ?? [];
  let error = first.error;
  if (isMissingProjectColumn(error)) {
    const legacy = await query(POST_FIELDS_LEGACY);
    rows = (legacy.data ?? []).map((row) => ({ ...(row as object), project: "vigo" }));
    error = legacy.error;
  }
  if (error) {
    const hint = error.message.includes("threads_posts")
      ? "資料庫尚未更新，請到 Supabase SQL Editor 執行 033_threads_autopost.sql"
      : error.message;
    return { posts: [], error: hint };
  }
  return { posts: rows as ThreadsPost[] };
}

export async function getThreadsConnection(): Promise<ThreadsConnection> {
  const db = threadsDb();
  if (!db) return { connected: false, username: null, expiresAt: null };
  const { data } = await db
    .from("threads_credentials")
    .select("threads_username, expires_at")
    .eq("id", 1)
    .maybeSingle();
  return {
    connected: Boolean(data),
    username: (data?.threads_username as string | null) ?? null,
    expiresAt: (data?.expires_at as string | null) ?? null,
  };
}

function expiresAtFrom(expiresIn: number | null): string | null {
  return expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
}

/** 管理員貼上權杖：先試著換成長效權杖（換不了就當作已是長效），確認帳號後存起來 */
export async function connectThreadsWithToken(rawToken: string): Promise<{ username: string }> {
  const token = rawToken.trim();
  if (token.length < 20) throw new ThreadsApiError("權杖看起來不完整，請重新複製");

  let accessToken = token;
  let expiresIn: number | null = null;
  try {
    const exchanged = await exchangeForLongLivedToken(token);
    accessToken = exchanged.accessToken;
    expiresIn = exchanged.expiresIn;
  } catch (error) {
    // 缺 App 密鑰要讓管理員知道；其他錯誤多半是「已經是長效權杖」，直接用原本的
    if (error instanceof ThreadsApiError && error.message.includes("THREADS_APP_SECRET")) {
      throw error;
    }
  }

  const me = await getThreadsMe(accessToken);
  const db = requireDb();
  const now = new Date().toISOString();
  const { error } = await db.from("threads_credentials").upsert({
    id: 1,
    access_token: accessToken,
    threads_user_id: me.id,
    threads_username: me.username,
    expires_at: expiresAtFrom(expiresIn),
    refreshed_at: now,
    updated_at: now,
  });
  if (error) throw new Error(error.message);
  return { username: me.username };
}

export async function disconnectThreads(): Promise<void> {
  const db = requireDb();
  const { error } = await db.from("threads_credentials").delete().eq("id", 1);
  if (error) throw new Error(error.message);
}

/** 取得可用權杖；快到期（10 天內）或不知道到期日時，順手續期 */
export async function getUsableCredentials() {
  const db = requireDb();
  const { data, error } = await db
    .from("threads_credentials")
    .select("access_token, threads_user_id, expires_at, refreshed_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new ThreadsApiError("尚未連結 Threads 帳號，請到 /admin/threads 貼上權杖");

  let token = data.access_token as string;
  const expiresAt = data.expires_at ? new Date(data.expires_at as string).getTime() : null;
  const refreshedAt = new Date(data.refreshed_at as string).getTime();
  const tenDays = 10 * 24 * 60 * 60 * 1000;
  const oldEnough = Date.now() - refreshedAt > 24 * 60 * 60 * 1000;
  const needsRefresh = expiresAt === null || expiresAt - Date.now() < tenDays;

  if (needsRefresh && oldEnough) {
    try {
      const refreshed = await refreshLongLivedToken(token);
      token = refreshed.accessToken;
      const now = new Date().toISOString();
      await db
        .from("threads_credentials")
        .update({
          access_token: token,
          expires_at: expiresAtFrom(refreshed.expiresIn),
          refreshed_at: now,
          updated_at: now,
        })
        .eq("id", 1);
    } catch (refreshError) {
      // 續期失敗但權杖可能還沒過期，先照用；真的過期時發文會失敗並記錄錯誤
      console.error("[threads] 權杖續期失敗：", refreshError);
    }
  }

  let userId = (data.threads_user_id as string | null) ?? null;
  if (!userId) userId = (await getThreadsMe(token)).id;
  return { token, userId };
}

/**
 * 專案輪流：allowed 已照 sort_order 排好；挑「最久沒發」的專案（從沒發過的最優先，
 * 同樣沒發過時看誰的文案 sort_order 比較前面），再取那個專案的第一篇。
 */
function pickRotationCandidate<T extends { project: unknown }>(
  allowed: T[],
  postedRows: { project: unknown; posted_at: unknown }[],
): T | undefined {
  const lastPosted = new Map<string, number>();
  for (const row of postedRows) {
    const project = String(row.project);
    if (!lastPosted.has(project)) lastPosted.set(project, new Date(String(row.posted_at)).getTime());
  }
  let best: T | undefined;
  let bestTime = Infinity;
  for (const row of allowed) {
    const time = lastPosted.get(String(row.project)) ?? -Infinity;
    // allowed 已照順序排，同一個時間只留第一個（sort_order 最小）
    if (time < bestTime) {
      best = row;
      bestTime = time;
    }
  }
  return best;
}

export type PublishResult =
  | { ok: true; posted: false; reason: string }
  | { ok: true; posted: true; postId: string; permalink: string | null; replyError?: string }
  | { ok: false; error: string; postId?: string };

/**
 * 取出下一篇「已核准」的文案發出；沒有就什麼都不做。
 * 防封規則（2026-11-17，工作室帳號）：
 *   1. 距離上一篇不到 6 小時、或台北今天已發 2 篇就不發（2026-11-18 改成每天最多 2 篇，手動按「現在發」也一樣）
 *   2. 帶連結的貼文最多每 4 篇 1 篇：最近 3 篇有帶連結時，跳過含連結的文案，改發下一篇沒連結的
 *   3. 指定 project 時只挑那個專案的文案，沒有就跳過、不改發別的
 *   4. 沒指定 project 時照專案輪流：在有已核准文案的專案裡，挑「最久沒發」的那個，再取它 sort_order 最小的一篇
 */
export async function publishNextApprovedPost(
  options: { project?: ThreadsProject } = {},
): Promise<PublishResult> {
  const db = threadsDb();
  if (!db) return { ok: false, error: "伺服器缺少 SUPABASE_SERVICE_ROLE_KEY" };

  const { data: recent, error: recentError } = await db
    .from("threads_posts")
    .select("body, first_reply, status, posted_at")
    .in("status", ["posted", "posting"])
    .order("posted_at", { ascending: false, nullsFirst: true })
    .limit(LINK_POST_WINDOW - 1);
  if (recentError) return { ok: false, error: recentError.message };

  if (recent?.some((row) => row.status === "posting")) {
    return { ok: true, posted: false, reason: "有一篇還在「發送中」，先到後台確認再發" };
  }
  const lastPostedAt = recent?.[0]?.posted_at ? new Date(recent[0].posted_at as string).getTime() : 0;
  if (Date.now() - lastPostedAt < MIN_HOURS_BETWEEN_POSTS * 60 * 60 * 1000) {
    return { ok: true, posted: false, reason: "距離上一篇不到 6 小時，這次先不發（每天最多 2 篇）" };
  }
  const { count: postedToday, error: countError } = await db
    .from("threads_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "posted")
    .gte("posted_at", startOfTaipeiDay(taipeiDateString(new Date())).toISOString());
  if (countError) return { ok: false, error: countError.message };
  if ((postedToday ?? 0) >= MAX_POSTS_PER_DAY) {
    return { ok: true, posted: false, reason: "今天已發 2 篇，這次先不發（每天最多 2 篇）" };
  }
  const recentHasLink = (recent ?? []).some((row) =>
    containsLink(row.body as string, row.first_reply as string | null),
  );

  let candidateQuery = db
    .from("threads_posts")
    .select("id, body, first_reply, project")
    .eq("status", "approved");
  if (options.project) candidateQuery = candidateQuery.eq("project", options.project);
  const { data: candidates, error: nextError } = await candidateQuery
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(300);
  if (nextError) return { ok: false, error: nextError.message };
  if (!candidates || candidates.length === 0) {
    return {
      ok: true,
      posted: false,
      reason: options.project
        ? `沒有已核准的「${THREADS_PROJECT_LABEL[options.project]}」文案，這次跳過`
        : "沒有已核准的文案",
    };
  }
  const allowed = recentHasLink
    ? candidates.filter((row) => !containsLink(row.body as string, row.first_reply as string | null))
    : candidates;
  let next: (typeof allowed)[number] | undefined = allowed[0];
  if (next && !options.project) {
    const { data: postedRows, error: postedError } = await db
      .from("threads_posts")
      .select("project, posted_at")
      .eq("status", "posted")
      .not("posted_at", "is", null)
      .order("posted_at", { ascending: false })
      .limit(500);
    if (postedError) return { ok: false, error: postedError.message };
    next = pickRotationCandidate(allowed, postedRows ?? []);
  }
  if (!next) {
    return {
      ok: true,
      posted: false,
      reason: "排隊中的文案都帶連結，但最近 3 篇內已有帶連結的貼文；請核准一篇沒有連結的",
    };
  }

  let credentials: { token: string; userId: string };
  try {
    credentials = await getUsableCredentials();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  // 先把這篇標成「發送中」，同時有兩次執行時只有一次領得到
  const { data: claimed } = await db
    .from("threads_posts")
    .update({ status: "posting", updated_at: new Date().toISOString() })
    .eq("id", next.id)
    .eq("status", "approved")
    .select("id, body, first_reply")
    .maybeSingle();
  if (!claimed) return { ok: true, posted: false, reason: "這篇已被另一次執行領走" };

  const postId = claimed.id as string;
  try {
    const { mediaId } = await publishTextPost({
      token: credentials.token,
      userId: credentials.userId,
      text: claimed.body as string,
    });
    const permalink = await getPermalink(credentials.token, mediaId);

    let replyError: string | undefined;
    const reply = (claimed.first_reply as string | null)?.trim();
    if (reply) {
      try {
        await publishTextPost({
          token: credentials.token,
          userId: credentials.userId,
          text: reply,
          replyToId: mediaId,
        });
      } catch (error) {
        replyError = `主文已發出，但第一則留言失敗：${error instanceof Error ? error.message : String(error)}`;
      }
    }

    await db
      .from("threads_posts")
      .update({
        status: "posted",
        threads_media_id: mediaId,
        threads_permalink: permalink,
        posted_at: new Date().toISOString(),
        last_error: replyError ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    return { ok: true, posted: true, postId, permalink, replyError };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .from("threads_posts")
      .update({ status: "failed", last_error: message, updated_at: new Date().toISOString() })
      .eq("id", postId);
    return { ok: false, error: message, postId };
  }
}

export async function updateThreadsPost(
  id: string,
  fields: Partial<Pick<ThreadsPost, "body" | "first_reply" | "style" | "project" | "status" | "sort_order">>,
) {
  const db = requireDb();
  const run = (values: typeof fields) =>
    db
      .from("threads_posts")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id)
      // 已發出或發送中的不能再改
      .not("status", "in", "(posted,posting)");
  let { error } = await run(fields);
  if (isMissingProjectColumn(error) && "project" in fields) {
    const { project: _project, ...rest } = fields;
    void _project;
    ({ error } = await run(rest));
  }
  if (error) throw new Error(error.message);
}

/** 一次改狀態：草稿全部核准，或已核准全部改回草稿（暫停）；回傳改了幾篇 */
export async function bulkSetThreadsStatus(
  from: "draft" | "approved",
  to: "draft" | "approved",
): Promise<number> {
  const db = requireDb();
  const { data, error } = await db
    .from("threads_posts")
    .update({ status: to, updated_at: new Date().toISOString() })
    .eq("status", from)
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

/** 卡在「發送中」（例如執行逾時）時，讓管理員手動改成失敗 */
export async function markStuckPostFailed(id: string) {
  const db = requireDb();
  const { error } = await db
    .from("threads_posts")
    .update({
      status: "failed",
      last_error: "管理員手動標為失敗（請先到 Threads 確認是否其實已發出，避免重複）",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "posting");
  if (error) throw new Error(error.message);
}

export async function createThreadsPost(fields: {
  body: string;
  first_reply: string | null;
  style: string | null;
  project: ThreadsProject;
  sort_order: number;
  seed_key?: string;
}) {
  const db = requireDb();
  let { error } = await db.from("threads_posts").insert({ ...fields, status: "draft" });
  if (isMissingProjectColumn(error)) {
    const { project: _project, ...rest } = fields;
    void _project;
    ({ error } = await db.from("threads_posts").insert({ ...rest, status: "draft" }));
  }
  if (error) throw new Error(error.message);
}

export async function deleteThreadsPost(id: string) {
  const db = requireDb();
  const { error } = await db
    .from("threads_posts")
    .delete()
    .eq("id", id)
    .in("status", ["draft", "failed"]);
  if (error) throw new Error(error.message);
}

/** 匯入預設文案；seed_key 重複的會略過，順序照文案本身指定的 sort_order */
export async function importStarterPosts(
  posts: { key: string; style: string; body: string; first_reply: string | null; sort_order: number }[],
): Promise<number> {
  const db = requireDb();
  const { data: existing } = await db.from("threads_posts").select("seed_key").not("seed_key", "is", null);
  const have = new Set((existing ?? []).map((row) => row.seed_key as string));

  const rows = posts
    .filter((post) => !have.has(post.key))
    .map((post) => ({
      body: post.body,
      first_reply: post.first_reply,
      style: post.style,
      status: "draft",
      sort_order: post.sort_order,
      seed_key: post.key,
    }));
  if (rows.length === 0) return 0;
  const { error } = await db.from("threads_posts").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

export type BulkImportItem = { body: string; project: ThreadsProject; style: string | null; sort_order: number };

/** 批次匯入成草稿；body（去掉前後空白後）和現有任何一篇相同就跳過。回傳匯入與跳過的篇數 */
export async function bulkImportThreadsPosts(
  items: BulkImportItem[],
): Promise<{ imported: number; skipped: number }> {
  const db = requireDb();
  const { data: existing, error: readError } = await db.from("threads_posts").select("body").limit(5000);
  if (readError) throw new Error(readError.message);
  const seen = new Set((existing ?? []).map((row) => String(row.body).trim()));

  const rows = [];
  let skipped = 0;
  for (const item of items) {
    const body = item.body.trim();
    if (seen.has(body)) {
      skipped += 1;
      continue;
    }
    seen.add(body);
    rows.push({
      body,
      first_reply: null,
      style: item.style,
      project: item.project,
      status: "draft",
      sort_order: item.sort_order,
    });
  }
  if (rows.length > 0) {
    const { error } = await db.from("threads_posts").insert(rows);
    if (error) throw new Error(error.message);
  }
  return { imported: rows.length, skipped };
}
