import type { EmbedType } from "@/types/database";

export interface ParsedEmbed {
  type: EmbedType;
  embedId: string;
  thumbnailUrl: string | null;
}

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://vigo-woad.vercel.app";
}

export function parseEmbedUrl(url: string): ParsedEmbed | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const youtubeMatch = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/,
  );
  if (youtubeMatch) {
    const id = youtubeMatch[1];
    return {
      type: "youtube",
      embedId: id,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      embedId: vimeoMatch[1],
      thumbnailUrl: null,
    };
  }

  if (/instagram\.com\/(reel|p|tv)\//.test(trimmed)) {
    return {
      type: "instagram",
      embedId: trimmed,
      thumbnailUrl: null,
    };
  }

  if (/douyin\.com|iesdouyin\.com|tiktok\.com|xiaohongshu\.com|xhslink\.com|facebook\.com|fb\.watch/i.test(trimmed)) {
    return {
      type: "other",
      embedId: trimmed,
      thumbnailUrl: null,
    };
  }

  try {
    new URL(trimmed);
    return {
      type: "other",
      embedId: trimmed,
      thumbnailUrl: null,
    };
  } catch {
    return null;
  }
}

export function getEmbedSrc(type: EmbedType, embedId: string): string {
  switch (type) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${embedId}`;
    case "vimeo":
      return `https://player.vimeo.com/video/${embedId}`;
    case "instagram":
      return `${embedId.replace(/\/?$/, "/")}embed`;
    default:
      return embedId;
  }
}

export function getWatchUrl(embedUrl: string, parsed?: ParsedEmbed | null): string {
  const info = parsed ?? parseEmbedUrl(embedUrl);
  if (!info) return embedUrl;
  if (info.type === "youtube") {
    return `https://www.youtube.com/watch?v=${info.embedId}`;
  }
  if (info.type === "vimeo") {
    return `https://vimeo.com/${info.embedId}`;
  }
  return embedUrl;
}

export function resolvePortfolioThumbnail(
  embedUrl: string,
  thumbnailUrl?: string | null,
): string | null {
  const trimmed = thumbnailUrl?.trim();
  if (trimmed) return trimmed;
  return parseEmbedUrl(embedUrl)?.thumbnailUrl ?? null;
}

export function getInlineEmbedSrc(type: EmbedType, embedId: string): string {
  switch (type) {
    case "youtube": {
      const origin = encodeURIComponent(siteOrigin());
      return `${getEmbedSrc(type, embedId)}?rel=0&modestbranding=1&playsinline=1&origin=${origin}`;
    }
    case "vimeo":
      return `${getEmbedSrc(type, embedId)}?title=0&byline=0&portrait=0`;
    default:
      return getEmbedSrc(type, embedId);
  }
}

export function supportsInlineEmbed(parsed: ParsedEmbed | null): parsed is ParsedEmbed {
  return parsed !== null && (parsed.type === "youtube" || parsed.type === "vimeo");
}
