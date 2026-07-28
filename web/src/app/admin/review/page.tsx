import { Suspense } from "react";
import Link from "next/link";
import { AdminPublishedCreatorCard } from "@/components/admin/AdminPublishedCreatorCard";
import { PendingCreatorCard } from "@/components/admin/PendingCreatorCard";
import { PendingPortfolioRow } from "@/components/admin/PendingPortfolioRow";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getPendingCreators,
  getPendingPortfolioItems,
  getPublishedCreators,
} from "@/lib/data/admin";

export const metadata = {
  title: "審核管理",
};

async function PublishedCreatorsSection() {
  const publishedCreators = await getPublishedCreators();

  return (
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
  );
}

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
  const [pendingCreators, pendingItems] = await Promise.all([
    getPendingCreators(),
    getPendingPortfolioItems(),
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
                <PendingCreatorCard key={creator.id} creator={creator} />
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
                <PendingPortfolioRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>

        <Suspense
          fallback={
            <p className="text-sm text-[var(--text-muted)]">載入已公開創作者列表…</p>
          }
        >
          <PublishedCreatorsSection />
        </Suspense>
      </div>
    </section>
  );
}
