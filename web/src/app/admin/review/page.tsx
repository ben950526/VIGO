import Link from "next/link";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  approveCreator,
  approveCreatorAndWorks,
  approvePortfolioItem,
  rejectCreator,
  rejectPortfolioItem,
} from "@/actions/admin";
import { AdminPublishedCreatorCard } from "@/components/admin/AdminPublishedCreatorCard";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getPendingCreators,
  getPendingPortfolioItems,
  getPublishedCreators,
} from "@/lib/data/admin";

export const metadata = {
  title: "審核管理",
};

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    demoRemoved?: string;
    demoRemoveError?: string;
    demoSeeded?: string;
    demoSeedError?: string;
  }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const [pendingCreators, pendingItems, publishedCreators] = await Promise.all([
    getPendingCreators(),
    getPendingPortfolioItems(),
    getPublishedCreators(),
  ]);

  const totalPending = pendingCreators.length + pendingItems.length;

  return (
    <section className="section">
      <div className="container-narrow max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">審核管理</h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              待審項目：{totalPending} 件
            </p>
          </div>
          <Link href="/dashboard" className="btn-secondary text-sm">
            返回我的工作室
          </Link>
          <Link href="/admin/seed-demo" className="btn-secondary text-sm">
            建立示範帳號
          </Link>
          <Link href="/admin/remove-demo" className="btn-secondary text-sm">
            撤除假帳號
          </Link>
          <Link href="/admin/feedback" className="btn-secondary text-sm">
            使用者意見
          </Link>
          <Link href="/admin/bugs" className="btn-secondary text-sm">
            BUG 回報
          </Link>
        </div>

        {params.demoSeeded === "1" && (
          <p className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            已建立 6 個示範帳號（含資料與作品）。公開頁會顯示「示範帳號」標籤，且不會露出聯絡方式。
          </p>
        )}
        {params.demoSeedError && (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            建立示範帳號失敗：{decodeURIComponent(params.demoSeedError)}
          </p>
        )}

        {params.demoRemoved === "1" && (
          <p className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            已撤除所有假帳號（含作品與登入帳號）。
          </p>
        )}
        {params.demoRemoveError && (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            撤除失敗：{decodeURIComponent(params.demoRemoveError)}
          </p>
        )}

        <div className="mb-12">
          <h2 className="mb-4 text-xl font-bold">
            待審創作者 ({pendingCreators.length})
          </h2>
          {pendingCreators.length === 0 ? (
            <p className="text-[var(--text-muted)]">目前沒有待審創作者</p>
          ) : (
            <ul className="space-y-6">
              {pendingCreators.map((creator) => (
                <li
                  key={creator.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">{creator.studio_name}</h3>
                      <p className="text-sm text-[var(--text-muted)]">
                        {creator.contact_email} · {creator.region ?? "未填地區"} · slug:{" "}
                        {creator.slug}
                      </p>
                      {creator.bio && (
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                          {creator.bio}
                        </p>
                      )}
                      <p className="mt-2 text-sm">
                        待審作品：{" "}
                        {creator.portfolio_items.filter((p) => p.status === "pending").length}{" "}
                        件
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={approveCreatorAndWorks}>
                        <input type="hidden" name="id" value={creator.id} />
                        <SubmitButton className="btn-primary text-sm">通過（含全部作品）</SubmitButton>
                      </form>
                      <form action={approveCreator}>
                        <input type="hidden" name="id" value={creator.id} />
                        <SubmitButton className="btn-secondary text-sm">僅通過創作者</SubmitButton>
                      </form>
                      <form action={rejectCreator}>
                        <input type="hidden" name="id" value={creator.id} />
                        <SubmitButton
                          className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          pendingText="退件中…"
                        >
                          退件
                        </SubmitButton>
                      </form>
                    </div>
                  </div>

                  {creator.portfolio_items.length > 0 && (
                    <ul className="space-y-2 border-t border-[var(--border)] pt-4">
                      {creator.portfolio_items.map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
                          <span>
                            {item.title}{" "}
                            <span className="text-[var(--text-muted)]">({item.status})</span>
                          </span>
                          {item.status === "pending" && (
                            <div className="flex gap-2">
                              <form action={approvePortfolioItem}>
                                <input type="hidden" name="id" value={item.id} />
                                <SubmitButton className="text-[var(--accent)] hover:underline">
                                  通過作品
                                </SubmitButton>
                              </form>
                              <form action={rejectPortfolioItem}>
                                <input type="hidden" name="id" value={item.id} />
                                <SubmitButton className="text-red-600 hover:underline" pendingText="退件中…">
                                  退件
                                </SubmitButton>
                              </form>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-12">
          <h2 className="mb-4 text-xl font-bold">
            待審作品 — 已公開創作者 ({pendingItems.length})
          </h2>
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            創作者已通過審核，但新上的作品仍需核准。
          </p>
          {pendingItems.length === 0 ? (
            <p className="text-[var(--text-muted)]">目前沒有待審作品</p>
          ) : (
            <ul className="space-y-4">
              {pendingItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {item.creator.studio_name} · /creator/{item.creator.slug}
                    </p>
                    <a
                      href={item.embed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      預覽連結
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <form action={approvePortfolioItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <SubmitButton className="btn-primary text-sm">通過</SubmitButton>
                    </form>
                    <form action={rejectPortfolioItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <SubmitButton
                        className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600"
                        pendingText="退件中…"
                      >
                        退件
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold">
            下架工作室與作品 ({publishedCreators.length})
          </h2>
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            於審核管理下架或重新上架已通過審核的工作室與作品。下架後不會出現在探索頁與公開連結。
          </p>
          {publishedCreators.length === 0 ? (
            <p className="text-[var(--text-muted)]">目前沒有已公開的創作者</p>
          ) : (
            <ul className="space-y-6">
              {publishedCreators.map((creator) => (
                <AdminPublishedCreatorCard key={creator.id} creator={creator} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
