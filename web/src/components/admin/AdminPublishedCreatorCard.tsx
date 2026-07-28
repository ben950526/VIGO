import Link from "next/link";
import { adminSetCreatorListing, adminSetPortfolioListing } from "@/actions/admin";
import { AdminToggleForm } from "@/components/admin/AdminActionForm";
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
  return (
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">{creator.studio_name}</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {creator.region ?? "未填地區"} · slug: {creator.slug}
          </p>
          <p className="mt-2 text-sm">
            工作室狀態：
            <span
              className={
                creator.is_listed ? "font-medium text-green-700" : "font-medium text-red-600"
              }
            >
              {creator.is_listed ? "已上架" : "已下架"}
            </span>
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
          listed={creator.is_listed}
          className={
            creator.is_listed
              ? "rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              : "btn-primary text-sm"
          }
          pendingText={creator.is_listed ? "下架中…" : "上架中…"}
        >
          {creator.is_listed ? "下架工作室" : "重新上架工作室"}
        </AdminToggleForm>
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
                    listed={isPublic}
                    className={
                      isPublic
                        ? "text-red-600 hover:underline"
                        : "text-[var(--accent)] hover:underline"
                    }
                    pendingText="處理中…"
                  >
                    {isPublic ? "下架作品" : "重新上架作品"}
                  </AdminToggleForm>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
