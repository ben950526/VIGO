import Link from "next/link";
import {
  connectThreadsAction,
  createThreadsPostAction,
  deleteThreadsPostAction,
  disconnectThreadsAction,
  importStarterPostsAction,
  markStuckFailedAction,
  publishNowAction,
  saveThreadsPostAction,
} from "@/actions/admin-threads";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getThreadsConnection,
  listThreadsPosts,
  type ThreadsPost,
  type ThreadsPostStatus,
} from "@/lib/threads/store";

export const dynamic = "force-dynamic";

const statusLabel: Record<ThreadsPostStatus, string> = {
  draft: "草稿（不會發）",
  approved: "已核准・排隊中",
  posting: "發送中",
  posted: "已發出",
  failed: "失敗",
};

const statusClass: Record<ThreadsPostStatus, string> = {
  draft: "bg-[var(--surface)] text-[var(--text-muted)]",
  approved: "bg-emerald-50 text-emerald-800",
  posting: "bg-amber-50 text-amber-900",
  posted: "bg-sky-50 text-sky-900",
  failed: "bg-red-50 text-red-800",
};

const fieldClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none";

function formatTaipei(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
}

function PostEditor({ post }: { post: ThreadsPost }) {
  const locked = post.status === "posted" || post.status === "posting";
  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${statusClass[post.status]}`}>
          {statusLabel[post.status]}
        </span>
        {post.style && <span className="text-[var(--text-muted)]">風格：{post.style}</span>}
        <span className="text-[var(--text-muted)]">順序 {post.sort_order}</span>
        {post.posted_at && (
          <span className="text-[var(--text-muted)]">發出：{formatTaipei(post.posted_at)}</span>
        )}
        {post.threads_permalink && (
          <a
            href={post.threads_permalink}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent)] underline"
          >
            在 Threads 查看
          </a>
        )}
      </div>

      {post.last_error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{post.last_error}</p>
      )}

      {locked ? (
        <>
          <p className="whitespace-pre-wrap text-sm text-[var(--text)]">{post.body}</p>
          {post.first_reply && (
            <p className="mt-2 whitespace-pre-wrap border-l-2 border-[var(--border)] pl-3 text-xs text-[var(--text-muted)]">
              留言：{post.first_reply}
            </p>
          )}
          {post.status === "posting" && (
            <form action={markStuckFailedAction} className="mt-3">
              <input type="hidden" name="id" value={post.id} />
              <button type="submit" className="btn-secondary text-xs">
                卡住了？標為失敗
              </button>
            </form>
          )}
        </>
      ) : (
        <form action={saveThreadsPostAction} className="space-y-2">
          <input type="hidden" name="id" value={post.id} />
          <label className="block text-xs text-[var(--text-muted)]">
            主文（不要放連結，最多 500 字）
            <textarea name="body" defaultValue={post.body} rows={5} className={fieldClass} required />
          </label>
          <label className="block text-xs text-[var(--text-muted)]">
            第一則留言（放探索頁連結；空白就不留言）
            <textarea
              name="first_reply"
              defaultValue={post.first_reply ?? ""}
              rows={2}
              className={fieldClass}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              name="style"
              defaultValue={post.style ?? ""}
              placeholder="風格"
              className={`${fieldClass} max-w-[8rem]`}
            />
            <input
              name="sort_order"
              type="number"
              defaultValue={post.sort_order}
              className={`${fieldClass} max-w-[6rem]`}
              aria-label="順序（小的先發）"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {post.status === "approved" ? (
              <button type="submit" name="intent" value="unapprove" className="btn-secondary text-sm">
                改回草稿
              </button>
            ) : (
              <button type="submit" name="intent" value="approve" className="btn-primary text-sm">
                {post.status === "failed" ? "重新核准" : "核准發文"}
              </button>
            )}
            <button type="submit" name="intent" value="save" className="btn-secondary text-sm">
              只儲存
            </button>
          </div>
        </form>
      )}

      {(post.status === "draft" || post.status === "failed") && (
        <form action={deleteThreadsPostAction} className="mt-2">
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className="text-xs text-[var(--text-muted)] underline">
            刪除這篇
          </button>
        </form>
      )}
    </li>
  );
}

export default async function AdminThreadsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const { ok, error: errorMessage } = await searchParams;
  const [{ posts, error: loadError }, connection] = await Promise.all([
    listThreadsPosts(),
    getThreadsConnection(),
  ]);

  const queued = posts.filter((p) => p.status === "approved");
  const daysLeft = Math.floor(queued.length / 2);
  const active = posts.filter((p) => p.status !== "posted");
  const posted = posts.filter((p) => p.status === "posted").reverse();

  return (
    <section className="section">
      <div className="container-narrow max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Threads 自動發文</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              每天台北 12 點、21 點（該小時內）各發一篇「已核准」的文案，接著自動留言放探索頁連結。草稿不會發。
            </p>
          </div>
          <Link href="/admin/review" className="btn-secondary text-sm">
            返回審核管理
          </Link>
        </div>

        {ok && (
          <p className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {ok}
          </p>
        )}
        {errorMessage && (
          <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
            {errorMessage}
          </p>
        )}
        {loadError && (
          <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {loadError}
          </p>
        )}

        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-2 text-lg font-semibold">帳號連結</h2>
          {connection.connected ? (
            <div className="space-y-2 text-sm">
              <p>
                已連結 <strong>@{connection.username}</strong>
                {connection.expiresAt && (
                  <span className="text-[var(--text-muted)]">
                    （權杖到期：{formatTaipei(connection.expiresAt)}，到期前會自動續期）
                  </span>
                )}
              </p>
              <form action={disconnectThreadsAction}>
                <button type="submit" className="text-xs text-[var(--text-muted)] underline">
                  解除連結
                </button>
              </form>
            </div>
          ) : (
            <p className="mb-3 text-sm text-[var(--text-secondary)]">
              尚未連結。到 Graph API Explorer 產生 Threads 權杖後貼在下面（步驟見 web/THREADS_SETUP.md）。
            </p>
          )}
          <form action={connectThreadsAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              name="token"
              type="password"
              autoComplete="off"
              placeholder={connection.connected ? "要換帳號或重新授權時才貼" : "貼上 Threads 權杖"}
              className={fieldClass}
              required
            />
            <button type="submit" className="btn-primary shrink-0 text-sm">
              {connection.connected ? "重新連結" : "連結"}
            </button>
          </form>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm">
          <span>
            排隊中 <strong>{queued.length}</strong> 篇（約可發 {daysLeft} 天）
          </span>
          {queued.length < 6 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-900">快沒文案了</span>
          )}
          <form action={importStarterPostsAction}>
            <button type="submit" className="btn-secondary text-sm">
              匯入預設文案（草稿）
            </button>
          </form>
          {connection.connected && queued.length > 0 && (
            <form action={publishNowAction}>
              <button type="submit" className="btn-secondary text-sm">
                現在發下一篇
              </button>
            </form>
          )}
        </div>

        <details className="mb-8 rounded-xl border border-[var(--border)] p-4">
          <summary className="cursor-pointer text-sm font-semibold">新增一篇</summary>
          <form action={createThreadsPostAction} className="mt-3 space-y-2">
            <textarea name="body" rows={5} placeholder="主文（不要放連結）" className={fieldClass} required />
            <textarea name="first_reply" rows={2} placeholder="第一則留言（放探索頁連結）" className={fieldClass} />
            <div className="flex gap-2">
              <input name="style" placeholder="風格" className={`${fieldClass} max-w-[8rem]`} />
              <input
                name="sort_order"
                type="number"
                defaultValue={(posts.at(-1)?.sort_order ?? 0) + 10}
                className={`${fieldClass} max-w-[6rem]`}
                aria-label="順序"
              />
              <button type="submit" className="btn-primary text-sm">
                新增草稿
              </button>
            </div>
          </form>
        </details>

        <h2 className="mb-3 text-lg font-semibold">待發與草稿（{active.length}）</h2>
        {active.length === 0 ? (
          <p className="mb-8 text-sm text-[var(--text-muted)]">還沒有文案，可以先按「匯入預設文案」。</p>
        ) : (
          <ul className="mb-10 space-y-4">
            {active.map((post) => (
              <PostEditor key={post.id} post={post} />
            ))}
          </ul>
        )}

        <h2 className="mb-3 text-lg font-semibold">已發出（{posted.length}）</h2>
        {posted.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">尚未發出任何一篇。</p>
        ) : (
          <ul className="space-y-4">
            {posted.map((post) => (
              <PostEditor key={post.id} post={post} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
