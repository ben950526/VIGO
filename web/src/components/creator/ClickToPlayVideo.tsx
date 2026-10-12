"use client";

import { useState } from "react";
import {
  getInlineEmbedSrc,
  getWatchUrl,
  parseEmbedUrl,
  resolvePortfolioThumbnail,
  supportsInlineEmbed,
  watchDestinationLabel,
} from "@/lib/embed";
import type { EmbedType } from "@/types/database";

interface ClickToPlayVideoProps {
  embedType: EmbedType;
  embedUrl: string;
  title: string;
  thumbnailUrl?: string | null;
}

function PlayMark() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--btn)] text-lg text-white shadow-[var(--shadow)] transition-transform group-hover:scale-105">
      ▶
    </span>
  );
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
  const destination = watchUrl ? watchDestinationLabel(watchUrl) : "觀看作品";

  if (!watchUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">這則作品連結無法開啟</p>
      </div>
    );
  }

  if (!canInline) {
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group card block"
      >
        {thumb && !thumbError ? (
          <div className="relative aspect-video bg-[var(--bg)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setThumbError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
              <PlayMark />
            </div>
          </div>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-[var(--bg)] px-6 text-center">
            <PlayMark />
            <p className="text-sm font-semibold text-[var(--text)]">{destination}</p>
            <p className="text-xs text-[var(--text-muted)]">於新分頁開啟</p>
          </div>
        )}
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      {playing ? (
        <div className="aspect-video bg-[var(--bg)]">
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
          className="group relative aspect-video w-full bg-[var(--bg)] text-left"
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
          ) : null}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${
              thumb && !thumbError
                ? "bg-black/20 transition-colors group-hover:bg-black/30"
                : ""
            }`}
          >
            <PlayMark />
            {!thumb || thumbError ? (
              <p className="text-sm font-semibold text-[var(--text)]">站內播放</p>
            ) : null}
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
          className="btn-secondary flex-1 py-2 text-center text-sm"
        >
          {destination}
        </a>
      </div>
    </div>
  );
}
