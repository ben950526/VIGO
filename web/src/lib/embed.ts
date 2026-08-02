import type { EmbedType } from "@/types/database";

export interface ParsedEmbed {
  type: EmbedType;
  embedId: string;
  thumbnailUrl: string | null;
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

  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
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
      return `https://www.youtube.com/embed/${embedId}`;
    case "vimeo":
      return `https://player.vimeo.com/video/${embedId}`;
    case "instagram":
      return `${embedId.replace(/\/?$/, "/")}embed`;
    default:
      return embedId;
  }
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
    case "youtube":
      return `${getEmbedSrc(type, embedId)}?rel=0&modestbranding=1&playsinline=1`;
    case "vimeo":
      return `${getEmbedSrc(type, embedId)}`;
    default:
      return getEmbedSrc(type, embedId);
  }
}

export function supportsInlineEmbed(type: EmbedType): boolean {
  return type === "youtube" || type === "vimeo";
}
