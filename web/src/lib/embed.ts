import type { EmbedType } from "@/types/database";

export interface ParsedEmbed {
  type: EmbedType;
  embedId: string;
  thumbnailUrl: string | null;
}

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://vigo-woad.vercel.app";
}

function isYoutubeVideoId(id: string): boolean {
  return /^[\w-]{11}$/.test(id);
}

function youtubeHost(hostname: string): boolean {
  return (
    hostname === "youtu.be" ||
    hostname === "m.youtube.com" ||
    hostname === "music.youtube.com" ||
    hostname === "www.youtube.com" ||
    hostname === "youtube.com" ||
    hostname === "www.youtube-nocookie.com" ||
    hostname === "youtube-nocookie.com"
  );
}

function parseYoutubeVideoId(url: URL): string | null {
  if (!youtubeHost(url.hostname)) return null;

  if (url.hostname === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return isYoutubeVideoId(id) ? id : null;
  }

  const fromQuery = url.searchParams.get("v")?.trim() ?? "";
  if (isYoutubeVideoId(fromQuery)) return fromQuery;

  const parts = url.pathname.split("/").filter(Boolean);
  const kind = parts[0];
  const id = parts[1] ?? "";
  if ((kind === "embed" || kind === "shorts" || kind === "live") && isYoutubeVideoId(id)) {
    return id;
  }
  return null;
}

export function parseEmbedUrl(url: string): ParsedEmbed | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null;
  }

  const youtubeId = parseYoutubeVideoId(parsedUrl);
  if (youtubeId) {
    return {
      type: "youtube",
      embedId: youtubeId,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }
  if (youtubeHost(parsedUrl.hostname)) {
    return null;
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      embedId: vimeoMatch[1],
      thumbnailUrl: null,
    };
  }

  if (/instagram\.com\/(reel|p|tv)\//i.test(trimmed)) {
    return {
      type: "instagram",
      embedId: trimmed,
      thumbnailUrl: null,
    };
  }
  if (/instagram\.com/i.test(parsedUrl.hostname)) {
    return null;
  }

  if (/tiktok\.com\/@[^/]+\/video\//i.test(trimmed) || /vt\.tiktok\.com\//i.test(trimmed)) {
    return {
      type: "other",
      embedId: trimmed,
      thumbnailUrl: null,
    };
  }

  if (/douyin\.com|iesdouyin\.com|xiaohongshu\.com|xhslink\.com|facebook\.com\/(reel|watch|share)|fb\.watch/i.test(trimmed)) {
    return {
      type: "other",
      embedId: trimmed,
      thumbnailUrl: null,
    };
  }

  return null;
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

export function getWatchUrl(embedUrl: string, parsed?: ParsedEmbed | null): string | null {
  const info = parsed ?? parseEmbedUrl(embedUrl);
  if (!info) return null;
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
