import type { CreatorProfile, PortfolioItem, PriceListItem } from "@/types/database";
import { parsePriceList } from "@/lib/price-list";

/** 敲门前公開：僅基本識別資訊 */
export type PublicCreatorProfile = Pick<
  CreatorProfile,
  | "id"
  | "user_id"
  | "slug"
  | "studio_name"
  | "region"
  | "avatar_url"
  | "verification_status"
  | "subscription_tier"
  | "featured"
  | "is_listed"
  | "is_demo"
  | "turnaround"
  | "created_at"
  | "updated_at"
>;

/** 敲門後解鎖的完整工作室內容 */
export type CreatorKnockUnlock = {
  bio: string | null;
  style_tags: string[];
  service_types: string[];
  portfolio_items: PortfolioItem[];
  contact_email: string | null;
  line_id: string | null;
  phone: string | null;
  show_email: boolean;
  show_line: boolean;
  show_phone: boolean;
  price_min: number | null;
  price_max: number | null;
  price_list: PriceListItem[];
  revision_policy: string | null;
  response_time: string | null;
  team_size: string | null;
  platforms: string[];
  client_types: string[];
  languages: string[];
  typical_scope: string | null;
  website_url: string | null;
};

/** @deprecated 沿用舊名 */
export type CreatorStudioDetails = Omit<CreatorKnockUnlock, "bio" | "style_tags" | "service_types" | "portfolio_items">;

export function extractKnockUnlock(
  row: Record<string, unknown>,
): CreatorKnockUnlock {
  const portfolio_items = ((row.portfolio_items as PortfolioItem[]) ?? [])
    .filter((item) => item.status === "approved")
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    bio: (row.bio as string | null) ?? null,
    style_tags: (row.style_tags as string[]) ?? [],
    service_types: (row.service_types as string[]) ?? [],
    portfolio_items,
    contact_email: (row.contact_email as string | null) ?? null,
    line_id: (row.line_id as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    show_email: row.show_email !== false,
    show_line: row.show_line !== false,
    show_phone: row.show_phone !== false,
    price_min: (row.price_min as number | null) ?? null,
    price_max: (row.price_max as number | null) ?? null,
    price_list: parsePriceList(row.price_list),
    revision_policy: (row.revision_policy as string | null) ?? null,
    response_time: (row.response_time as string | null) ?? null,
    team_size: (row.team_size as string | null) ?? null,
    platforms: (row.platforms as string[]) ?? [],
    client_types: (row.client_types as string[]) ?? [],
    languages: (row.languages as string[]) ?? [],
    typical_scope: (row.typical_scope as string | null) ?? null,
    website_url: (row.website_url as string | null) ?? null,
  };
}

/** @deprecated */
export function extractStudioDetails(row: Record<string, unknown>): CreatorStudioDetails {
  const full = extractKnockUnlock(row);
  const { bio: _b, style_tags: _s, service_types: _st, portfolio_items: _p, ...rest } = full;
  return rest;
}

export function toPublicCreatorProfile(creator: CreatorProfile): PublicCreatorProfile {
  return {
    id: creator.id,
    user_id: creator.user_id,
    slug: creator.slug,
    studio_name: creator.studio_name,
    region: creator.region,
    avatar_url: creator.avatar_url,
    verification_status: creator.verification_status,
    subscription_tier: creator.subscription_tier,
    featured: creator.featured,
    is_listed: creator.is_listed,
    is_demo: creator.is_demo,
    turnaround: creator.turnaround,
    created_at: creator.created_at,
    updated_at: creator.updated_at,
  };
}

export function mergeCreatorWithUnlock(
  base: PublicCreatorProfile,
  unlock: CreatorKnockUnlock,
): CreatorProfile & { portfolio_items: PortfolioItem[] } {
  return { ...base, ...unlock };
}

/** @deprecated */
export function mergeCreatorWithDetails(
  base: CreatorProfile | PublicCreatorProfile,
  details: CreatorStudioDetails,
): CreatorProfile {
  return { ...base, ...details } as CreatorProfile;
}

const KNOCK_UNLOCK_SELECT =
  "bio, style_tags, service_types, contact_email, line_id, phone, show_email, show_line, show_phone, price_min, price_max, price_list, revision_policy, response_time, team_size, platforms, client_types, languages, typical_scope, website_url, portfolio_items(*)";

export { KNOCK_UNLOCK_SELECT };
