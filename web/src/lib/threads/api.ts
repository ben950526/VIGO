/**
 * Threads 官方 API（graph.threads.com）。只在伺服器端呼叫，權杖與 App 密鑰不可外流。
 * 文件：https://developers.facebook.com/docs/threads
 */
const GRAPH = "https://graph.threads.com";
const VERSION = "v1.0";

export class ThreadsApiError extends Error {}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined;
    throw new ThreadsApiError(err?.message ?? `Threads API ${res.status}`);
  }
  return data;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 短效權杖（1 小時）換長效權杖（60 天）；需要 App 密鑰 */
export async function exchangeForLongLivedToken(shortToken: string) {
  const secret = process.env.THREADS_APP_SECRET?.trim();
  if (!secret) throw new ThreadsApiError("Vercel 尚未設定 THREADS_APP_SECRET");
  const url = new URL(`${GRAPH}/access_token`);
  url.searchParams.set("grant_type", "th_exchange_token");
  url.searchParams.set("client_secret", secret);
  url.searchParams.set("access_token", shortToken);
  const data = await readJson(await fetch(url, { cache: "no-store" }));
  return {
    accessToken: String(data.access_token),
    expiresIn: Number(data.expires_in) || null,
  };
}

/** 長效權杖續期（需已存在至少 24 小時、尚未過期），續期後再 60 天 */
export async function refreshLongLivedToken(token: string) {
  const url = new URL(`${GRAPH}/refresh_access_token`);
  url.searchParams.set("grant_type", "th_refresh_token");
  url.searchParams.set("access_token", token);
  const data = await readJson(await fetch(url, { cache: "no-store" }));
  return {
    accessToken: String(data.access_token),
    expiresIn: Number(data.expires_in) || null,
  };
}

export async function getThreadsMe(token: string) {
  const url = new URL(`${GRAPH}/${VERSION}/me`);
  url.searchParams.set("fields", "id,username");
  url.searchParams.set("access_token", token);
  const data = await readJson(await fetch(url, { cache: "no-store" }));
  return { id: String(data.id), username: String(data.username ?? "") };
}

async function postForm(path: string, params: Record<string, string>) {
  const res = await fetch(`${GRAPH}/${VERSION}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
    cache: "no-store",
  });
  return readJson(res);
}

/**
 * 發一篇純文字貼文（replyToId 有值時就是留言）。
 * 流程：建立容器 → 稍等 → 發布；發布失敗會再試幾次（容器可能還在處理）。
 */
export async function publishTextPost(params: {
  token: string;
  userId: string;
  text: string;
  replyToId?: string;
}): Promise<{ mediaId: string }> {
  const container = await postForm(`${params.userId}/threads`, {
    media_type: "TEXT",
    text: params.text,
    access_token: params.token,
    ...(params.replyToId ? { reply_to_id: params.replyToId } : {}),
  });
  const creationId = String(container.id);

  let lastError: unknown;
  for (const waitMs of [3000, 8000, 15000]) {
    await sleep(waitMs);
    try {
      const published = await postForm(`${params.userId}/threads_publish`, {
        creation_id: creationId,
        access_token: params.token,
      });
      return { mediaId: String(published.id) };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new ThreadsApiError("發布失敗");
}

export async function getPermalink(token: string, mediaId: string): Promise<string | null> {
  try {
    const url = new URL(`${GRAPH}/${VERSION}/${mediaId}`);
    url.searchParams.set("fields", "permalink");
    url.searchParams.set("access_token", token);
    const data = await readJson(await fetch(url, { cache: "no-store" }));
    return typeof data.permalink === "string" ? data.permalink : null;
  } catch {
    return null;
  }
}
