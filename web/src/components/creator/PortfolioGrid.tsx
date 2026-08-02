import { ClickToPlayVideo } from "@/components/creator/ClickToPlayVideo";
import type { PortfolioItem } from "@/types/database";
import { parseEmbedUrl, resolvePortfolioThumbnail } from "@/lib/embed";

interface PortfolioGridProps {
  items: PortfolioItem[];
}

export function PortfolioGrid({ items }: PortfolioGridProps) {
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
              <h3 className="mb-2 text-lg font-bold text-[var(--text)]">
                {item.title}
              </h3>
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
