import { ClickToPlayVideo } from "@/components/creator/ClickToPlayVideo";
import { ContactSection } from "@/components/creator/ContactSection";
import { CreatorPriceList } from "@/components/creator/CreatorPriceList";
import { CreatorStudioInfo } from "@/components/creator/CreatorStudioInfo";
import { PortfolioGridWithFilter } from "@/components/creator/PortfolioGridWithFilter";
import { getFeaturedPortfolioItem, getFeaturedPortfolioItemForPreview } from "@/lib/portfolio";
import { resolvePortfolioThumbnail } from "@/lib/embed";
import type { CreatorWithPortfolio } from "@/types/database";
import { UnpublishedText } from "@/components/creator/UnpublishedText";
import { formatPriceRange } from "@/lib/utils";
import { isDemoCreator } from "@/lib/demo-creator";

interface CreatorFullContentProps {
  creator: CreatorWithPortfolio;
  /** 接案者預覽：含待審作品、顯示審核中標籤 */
  previewMode?: boolean;
}

export function CreatorFullContent({ creator, previewMode = false }: CreatorFullContentProps) {
  const heroItem = previewMode
    ? getFeaturedPortfolioItemForPreview(creator.portfolio_items)
    : getFeaturedPortfolioItem(creator.portfolio_items);
  const price = isDemoCreator(creator)
    ? null
    : formatPriceRange(creator.price_min, creator.price_max);

  return (
    <>
      <section className="border-b border-[var(--border)] bg-[var(--surface)] py-4">
        <div className="container-narrow">
          {price ? (
            <p className="mb-3 text-lg text-[var(--text-secondary)]">{price}</p>
          ) : !isDemoCreator(creator) ? (
            <p className="mb-3 text-sm text-[var(--text-muted)]">參考報價：尚未公布</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {creator.style_tags.length > 0 ? (
              creator.style_tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))
            ) : (
              <span className="text-sm text-[var(--text-muted)]">風格標籤：尚未公布</span>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="mb-4 text-2xl font-bold">關於工作室</h2>
            <p className="mb-6 whitespace-pre-wrap text-[var(--text-secondary)]">
              {creator.bio ?? "尚未公布"}
            </p>
            <p className="text-sm">
              <strong>服務：</strong>{" "}
              {creator.service_types.length > 0
                ? creator.service_types.join("、")
                : "尚未公布"}
            </p>
          </div>
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">精選作品</h2>
              {previewMode && heroItem?.status === "pending" && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                  預覽 · 審核中
                </span>
              )}
            </div>
            {heroItem ? (
              <ClickToPlayVideo
                embedType={heroItem.embed_type}
                embedUrl={heroItem.embed_url}
                title={heroItem.title}
                thumbnailUrl={resolvePortfolioThumbnail(
                  heroItem.embed_url,
                  heroItem.thumbnail_url,
                )}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]">
                <UnpublishedText />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow">
          <h2 className="mb-10 text-center text-3xl font-bold">全部作品</h2>
          <PortfolioGridWithFilter items={creator.portfolio_items} showPendingBadge={previewMode} />
        </div>
      </section>

      <CreatorStudioInfo creator={creator} />
      <CreatorPriceList creator={creator} />
      <ContactSection creator={creator} />
    </>
  );
}
