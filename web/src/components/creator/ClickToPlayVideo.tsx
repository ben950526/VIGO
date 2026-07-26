"use client";

import { useState } from "react";
import Image from "next/image";
import { getEmbedSrc, parseEmbedUrl } from "@/lib/embed";
import type { EmbedType } from "@/types/database";

interface ClickToPlayVideoProps {
  embedType: EmbedType;
  embedUrl: string;
  title: string;
  thumbnailUrl?: string | null;
}

export function ClickToPlayVideo({
  embedType,
  embedUrl,
  title,
  thumbnailUrl,
}: ClickToPlayVideoProps) {
  const [playing, setPlaying] = useState(false);
  const parsed = parseEmbedUrl(embedUrl);

  if (!parsed || embedType === "other") {
    return (
      <a
        href={embedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-video items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] hover:underline"
      >
        在新分頁開啟作品
      </a>
    );
  }

  if (playing) {
    const baseSrc = getEmbedSrc(parsed.type, parsed.embedId);
    const src =
      parsed.type === "youtube"
        ? `${baseSrc}?autoplay=1&playsinline=1&rel=0`
        : parsed.type === "vimeo"
          ? `${baseSrc}?autoplay=1`
          : baseSrc;

    return (
      <div className="aspect-video overflow-hidden rounded-2xl border border-[var(--border)] bg-black shadow-[var(--shadow)]">
        <iframe
          src={src}
          title={title}
          className="h-full w-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const thumb =
    thumbnailUrl ??
    parsed.thumbnailUrl ??
    "https://picsum.photos/seed/video/640/360";

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-black text-left shadow-[var(--shadow)]"
      aria-label={`播放 ${title}`}
    >
      <Image
        src={thumb}
        alt={title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 720px"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition-colors group-hover:bg-black/45">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-2xl text-[var(--text)] shadow-lg">
          ▶
        </span>
      </div>
      <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
        點擊播放（含聲音）
      </span>
    </button>
  );
}
