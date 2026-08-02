import Link from "next/link";
import { parseEmbedUrl } from "@/lib/embed";
import type { EmbedType } from "@/types/database";

interface AdminPortfolioPreviewProps {
  title: string;
  embedUrl: string;
  embedType: EmbedType;
  thumbnailUrl?: string | null;
  creatorSlug?: string;
}

function resolveThumbnail(
  embedUrl: string,
  thumbnailUrl?: string | null,
): string | null {
  const parsed = parseEmbedUrl(embedUrl);
  return thumbnailUrl ?? parsed?.thumbnailUrl ?? null;
}

export function AdminPortfolioPreview({
  title,
  embedUrl,
  embedType,
  thumbnailUrl,
  creatorSlug,
}: AdminPortfolioPreviewProps) {
  const parsed = parseEmbedUrl(embedUrl);
  const thumb = resolveThumbnail(embedUrl, thumbnailUrl);

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--surface)]">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--text-muted)]">
            無縮圖預覽
          </div>
        )}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
          <div className="flex flex-wrap gap-2">
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[var(--text)] shadow hover:bg-slate-100"
            >
              在新分頁預覽作品
            </a>
            {creatorSlug && (
              <Link
                href={`/creator/${creatorSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/80 bg-black/30 px-4 py-2 text-sm font-medium text-white hover:bg-black/50"
              >
                開工作室頁
              </Link>
            )}
          </div>
        </div>
      </div>
      <p className="px-4 py-2 text-xs text-[var(--text-muted)]">
        審核用預覽 · {embedType}
        {!parsed && " · 連結格式無法解析，請用新分頁確認"}
      </p>
    </div>
  );
}
