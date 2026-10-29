import { createClient } from "@supabase/supabase-js";
import {
  exchangeForLongLivedToken,
  getPermalink,
  getThreadsMe,
  publishTextPost,
  refreshLongLivedToken,
  ThreadsApiError,
} from "@/lib/threads/api";

/** 只在伺服器用；兩張表沒有 RLS policy，只有 service role 讀得到（見 033） */
function threadsDb() {
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

const POST_FIELDS =
  "id, body, first_reply, style, status, sort_order, threads_permalink, posted_at, last_error, created_at";

function requireDb() {
  const db = threadsDb();
  if (!db) throw new Error("伺服器缺少 SUPABASE_SERVICE_ROLE_KEY");
  return db;
}

export async function listThreadsPosts(): Promise<{ posts: ThreadsPost[]; error?: string }> {
  const db = threadsDb();
  if (!db) return { posts: [], error: "伺服器缺少 SUPABASE_SERVICE_ROLE_KEY" };
  const { data, error } = await db
    .from("threads_posts")
    .select(POST_FIELDS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(300);
  if (error) {
    const hint = error.message.includes("threads_posts")
      ? "資料庫尚未更新，請到 Supabase SQL Editor 執行 033_threads_autopost.sql"
      : error.message;
    return { posts: [], error: hint };
  }
  return { posts: (data ?? []) as ThreadsPost[] };
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
async function getUsableCredentials() {
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

export type PublishResult =
  | { ok: true; posted: false; reason: string }
  | { ok: true; posted: true; postId: string; permalink: string | null; replyError?: string }
  | { ok: false; error: string; postId?: string };

/** 取出下一篇「已核准」的文案發出；沒有就什麼都不做 */
export async function publishNextApprovedPost(): Promise<PublishResult> {
  const db = threadsDb();
  if (!db) return { ok: false, error: "伺服器缺少 SUPABASE_SERVICE_ROLE_KEY" };

  const { data: next, error: nextError } = await db
    .from("threads_posts")
    .select("id")
    .eq("status", "approved")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (nextError) return { ok: false, error: nextError.message };
  if (!next) return { ok: true, posted: false, reason: "沒有已核准的文案" };

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
  fields: Partial<Pick<ThreadsPost, "body" | "first_reply" | "style" | "status" | "sort_order">>,
) {
  const db = requireDb();
  const { error } = await db
    .from("threads_posts")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    // 已發出或發送中的不能再改
    .not("status", "in", "(posted,posting)");
  if (error) throw new Error(error.message);
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
  sort_order: number;
  seed_key?: string;
}) {
  const db = requireDb();
  const { error } = await db.from("threads_posts").insert({ ...fields, status: "draft" });
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

/** 匯入預設文案；seed_key 重複的會略過 */
export async function importStarterPosts(
  posts: { key: string; style: string; body: string }[],
  firstReply: string,
): Promise<number> {
  const db = requireDb();
  const { data: existing } = await db.from("threads_posts").select("seed_key").not("seed_key", "is", null);
  const have = new Set((existing ?? []).map((row) => row.seed_key as string));
  const { data: last } = await db
    .from("threads_posts")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  let order = ((last?.sort_order as number | undefined) ?? 0) + 10;

  const rows = posts
    .filter((post) => !have.has(post.key))
    .map((post) => {
      const row = {
        body: post.body,
        first_reply: firstReply,
        style: post.style,
        status: "draft",
        sort_order: order,
        seed_key: post.key,
      };
      order += 10;
      return row;
    });
  if (rows.length === 0) return 0;
  const { error } = await db.from("threads_posts").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}
