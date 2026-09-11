import { setFeaturedPortfolioItem } from "@/actions/creator";
import { AddPortfolioForm } from "@/components/dashboard/AddPortfolioForm";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { isFeaturedPortfolioItem } from "@/lib/portfolio";
import type { PortfolioItem } from "@/types/database";

interface PortfolioSectionProps {
  portfolio: PortfolioItem[];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-[var(--border)] pb-2 text-lg font-bold text-[var(--text)]">
      {children}
    </h2>
  );
}

export function PortfolioSection({ portfolio }: PortfolioSectionProps) {
  return (
    <div id="portfolio" className="scroll-mt-8 space-y-6">
      <div>
        <SectionTitle>作品集</SectionTitle>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          公開頁的「精選作品」= 排序第一且已審核通過的作品。審核通過後可在下方設為精選。
        </p>
      </div>

      {portfolio.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">尚無作品，請在下方新增 YouTube / Reels 連結。</p>
      ) : (
        <ul className="space-y-3">
          {portfolio.map((item) => {
            const isFeatured = isFeaturedPortfolioItem(item, portfolio);
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    {isFeatured && item.status === "approved" && (
                      <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        精選作品
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    狀態：
                    {item.status === "approved"
                      ? "已公開"
                      : item.status === "pending"
                        ? "審核中"
                        : "未通過"}
                  </p>
                </div>
                {!isFeatured && item.status === "approved" && (
                  <form action={setFeaturedPortfolioItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton className="btn-secondary text-sm">設為精選</SubmitButton>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AddPortfolioForm />
    </div>
  );
}
