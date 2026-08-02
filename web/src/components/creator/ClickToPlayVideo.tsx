"use client";

import { useState } from "react";
import {
  getInlineEmbedSrc,
  getWatchUrl,
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

export function ClickToPlayVideo({
  embedUrl,
  title,
  thumbnailUrl,
}: ClickToPlayVideoProps) {
  const [playing, setPlaying] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const parsed = parseEmbedUrl(embedUrl);
  const watchUrl = getWatchUrl(embedUrl, parsed);
  const thumb = resolvePortfolioThumbnail(embedUrl, thumbnailUrl);
  const canInline = supportsInlineEmbed(parsed);

  if (!parsed || !canInline) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="relative aspect-video bg-slate-900">
          {thumb && !thumbError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={title}
              className="h-full w-full object-cover opacity-80"
              loading="lazy"
              onError={() => setThumbError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">
              此平台請在新分頁觀看
            </div>
          )}
        </div>
        <div className="p-4">
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex w-full justify-center py-2.5 text-sm"
          >
            在新分頁觀看「{title}」
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      {playing ? (
        <div className="aspect-video bg-black">
          <iframe
            src={getInlineEmbedSrc(parsed.type, parsed.embedId)}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative aspect-video w-full bg-slate-900 text-left"
          aria-label={`站內播放 ${title}`}
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
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">
              點擊站內播放
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition-colors group-hover:bg-black/45">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-2xl text-[var(--text)] shadow-lg">
              ▶
            </span>
          </div>
        </button>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] p-3">
        {!playing && (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="btn-primary flex-1 py-2 text-sm"
          >
            站內播放
          </button>
        )}
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn-secondary py-2 text-center text-sm ${playing ? "flex-1" : "flex-1"}`}
        >
          新分頁觀看（較穩定）
        </a>
      </div>
    </div>
  );
}
