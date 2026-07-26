export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

/** Next.js may pass dynamic route params still URL-encoded (e.g. %E5%93%88). */
export function normalizeSlugParam(raw: string): string {
  let slug = raw.trim();
  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(slug);
      if (decoded === slug) break;
      slug = decoded;
    } catch {
      break;
    }
  }
  return slug;
}

/** Prefer ASCII slugs so /creator/[slug] works reliably on all hosts. */
export function createCreatorSlug(studioName: string, userId: string): string {
  const ascii = studioName
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  if (/^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/.test(ascii)) {
    return ascii;
  }

  return `creator-${userId.slice(0, 8)}`;
}

export function formatPriceRange(
  min: number | null,
  max: number | null,
): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      maximumFractionDigits: 0,
    }).format(n);
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `${fmt(min)} 起`;
  if (max != null) return `最高 ${fmt(max)}`;
  return null;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
