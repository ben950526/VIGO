import { ClickToPlayVideo } from "@/components/creator/ClickToPlayVideo";
import type { PortfolioItem } from "@/types/database";
import { parseEmbedUrl, resolvePortfolioThumbnail } from "@/lib/embed";

interface PortfolioGridProps {
  items: PortfolioItem[];
  showPendingBadge?: boolean;
}

export function PortfolioGrid({ items, showPendingBadge = false }: PortfolioGridProps) {
  if (items.length === 0) {
    return (
      <p className="text-center text-[var(--text-muted)]">尚未公布</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {items.map((item) => {
        const parsed = parseEmbedUrl(item.embed_url);
        const thumb = resolvePortfolioThumbnail(item.embed_url, item.thumbnail_url);

        return (
          <article key={item.id} className="space-y-4">
            <ClickToPlayVideo
              embedType={parsed?.type ?? item.embed_type}
              embedUrl={item.embed_url}
              title={item.title}
              thumbnailUrl={thumb}
            />
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-[var(--text)]">{item.title}</h3>
                {showPendingBadge && item.status === "pending" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                    預覽 · 審核中
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mb-3 text-sm text-[var(--text-secondary)]">
                  {item.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {item.style_tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
