import Link from "next/link";
import { adminSetCreatorListing, adminSetPortfolioListing } from "@/actions/admin";
import { AdminToggleForm } from "@/components/admin/AdminActionForm";
import { DemoBadge } from "@/components/creator/DemoBadge";
import { isCreatorVisibleOnExplore } from "@/lib/creator/listing";
import type { CreatorProfile, PortfolioItem } from "@/types/database";

interface AdminPublishedCreatorCardProps {
  creator: CreatorProfile & { portfolio_items: PortfolioItem[] };
}

const portfolioStatusLabel: Record<PortfolioItem["status"], string> = {
  approved: "已公開",
  pending: "待審",
  rejected: "已下架",
};

export function AdminPublishedCreatorCard({
  creator,
}: AdminPublishedCreatorCardProps) {
  const visibleOnExplore = isCreatorVisibleOnExplore(creator);
  const studioListed = creator.is_listed !== false;

  return (
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{creator.studio_name}</h3>
            <DemoBadge creator={creator} />
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {creator.region ?? "未填地區"} · slug: {creator.slug}
          </p>
          <p className="mt-2 text-sm">
            工作室上架：
            <span
              className={
                studioListed ? "font-medium text-green-700" : "font-medium text-red-600"
              }
            >
              {studioListed ? "是（未下架）" : "否（已下架）"}
            </span>
          </p>
          <p className="mt-1 text-sm">
            探索頁：
            <span
              className={
                visibleOnExplore ? "font-medium text-green-700" : "font-medium text-amber-700"
              }
            >
              {visibleOnExplore ? "可見" : "不可見"}
            </span>
            {!visibleOnExplore && creator.verification_status !== "approved" ? (
              <span className="text-[var(--text-muted)]">（需審核通過）</span>
            ) : null}
          </p>
          <Link
            href={`/creator/${creator.slug}`}
            className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            查看公開頁
          </Link>
        </div>
        <AdminToggleForm
          action={adminSetCreatorListing}
          id={creator.id}
          slug={creator.slug}
          listed={studioListed}
          className={
            studioListed
              ? "rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              : "btn-primary text-sm"
          }
          pendingText={studioListed ? "下架中…" : "上架中…"}
          labelWhenListed="下架工作室"
          labelWhenUnlisted="重新上架工作室"
        />
      </div>

      {creator.portfolio_items.length === 0 ? (
        <p className="border-t border-[var(--border)] pt-4 text-sm text-[var(--text-muted)]">
          尚無作品
        </p>
      ) : (
        <ul className="space-y-2 border-t border-[var(--border)] pt-4">
          {creator.portfolio_items.map((item) => {
            const isPublic = item.status === "approved";
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  {item.title}{" "}
                  <span
                    className={
                      item.status === "approved"
                        ? "text-green-700"
                        : item.status === "pending"
                          ? "text-amber-700"
                          : "text-red-600"
                    }
                  >
                    ({portfolioStatusLabel[item.status]})
                  </span>
                </span>
                {item.status !== "pending" && (
                  <AdminToggleForm
                    action={adminSetPortfolioListing}
                    id={item.id}
                    slug={creator.slug}
                    listed={isPublic}
                    className={
                      isPublic
                        ? "text-red-600 hover:underline"
                        : "text-[var(--accent)] hover:underline"
                    }
                    pendingText="處理中…"
                    labelWhenListed="下架作品"
                    labelWhenUnlisted="重新上架作品"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
