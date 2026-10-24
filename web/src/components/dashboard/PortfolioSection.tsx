import { AddPortfolioForm } from "@/components/dashboard/AddPortfolioForm";
import { PortfolioItemEditor } from "@/components/dashboard/PortfolioItemEditor";
import { FREE_PORTFOLIO_LIMIT } from "@/lib/constants";
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
          建議至少加 1 支，最多 {FREE_PORTFOLIO_LIMIT} 支。公開頁只顯示已通過的作品；預覽會連審核中的一起看。已通過的連結可在這裡修改或移除。
        </p>
      </div>

      {portfolio.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">尚無作品，請在下方新增 YouTube / Reels 連結。</p>
      ) : (
        <ul className="space-y-3">
          {portfolio.map((item) => (
            <PortfolioItemEditor key={item.id} item={item} portfolio={portfolio} />
          ))}
        </ul>
      )}

      {portfolio.length >= FREE_PORTFOLIO_LIMIT ? (
        <p className="text-sm text-[var(--text-muted)]">
          目前最多 {FREE_PORTFOLIO_LIMIT} 支。若要換作品，先移除舊的再新增。
        </p>
      ) : (
        <AddPortfolioForm />
      )}
    </div>
  );
}
