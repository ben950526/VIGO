"use client";

import { useState } from "react";
import {
  getInlineEmbedSrc,
  parseEmbedUrl,
  resolvePortfolioThumbnail,
  supportsInlineEmbed,
} from "@/lib/embed";
import type { EmbedType } from "@/types/database";

interface ClickToPlayVideoProps {
  embedType: EmbedType;
  embedUrl: string;
  title: string;
  thumbnailUrl?: string | null;
}

function ExternalEmbedLink({ embedUrl, title }: { embedUrl: string; title: string }) {
  return (
    <a
      href={embedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex aspect-video items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 text-center text-[var(--accent)] hover:underline"
    >
      在新分頁開啟「{title}」
    </a>
  );
}

export function ClickToPlayVideo({
  embedType,
  embedUrl,
  title,
  thumbnailUrl,
}: ClickToPlayVideoProps) {
  const [playing, setPlaying] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const parsed = parseEmbedUrl(embedUrl);

  if (!parsed) {
    return <ExternalEmbedLink embedUrl={embedUrl} title={title} />;
  }

  const playbackType = parsed.type !== "other" ? parsed.type : embedType;

  if (!supportsInlineEmbed(playbackType)) {
    return <ExternalEmbedLink embedUrl={embedUrl} title={title} />;
  }

  if (playing) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-[var(--border)] bg-black shadow-[var(--shadow)]">
        <iframe
          src={getInlineEmbedSrc(playbackType, parsed.embedId)}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-1 text-xs text-white hover:bg-black/90"
        >
          無法播放？新分頁開啟
        </a>
      </div>
    );
  }

  const thumb = resolvePortfolioThumbnail(embedUrl, thumbnailUrl);

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-slate-900 text-left shadow-[var(--shadow)]"
      aria-label={`播放 ${title}`}
    >
      {thumb && !thumbError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={() => setThumbError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-sm text-slate-300">
          點擊播放影片
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition-colors group-hover:bg-black/45">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-2xl text-[var(--text)] shadow-lg">
          ▶
        </span>
      </div>
      <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
        點擊播放
      </span>
    </button>
  );
}
