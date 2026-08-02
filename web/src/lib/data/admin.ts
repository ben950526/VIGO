import type { CreatorProfile, PortfolioItem } from "@/types/database";
import { parsePriceList } from "@/lib/price-list";
import { createClient } from "@/lib/supabase/server";

const PENDING_CREATOR_FIELDS =
  "id, user_id, studio_name, slug, region, bio, avatar_url, service_types, style_tags, price_min, price_max, price_list, contact_email, line_id, phone, show_email, show_line, show_phone, verification_status, turnaround, revision_policy, response_time, team_size, platforms, client_types, languages, typical_scope, website_url, created_at";
const PORTFOLIO_REVIEW_FIELDS =
  "id, title, description, embed_url, embed_type, thumbnail_url, style_tags, sort_order, status, creator_id, created_at";
const PUBLISHED_CREATOR_FIELDS = "id, studio_name, slug, region, is_listed, updated_at";

export interface PendingCreator extends CreatorProfile {
  portfolio_items: PortfolioItem[];
}

export async function getPendingCreators(): Promise<PendingCreator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(`${PENDING_CREATOR_FIELDS}, portfolio_items(${PORTFOLIO_REVIEW_FIELDS})`)
    .eq("verification_status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      ...(record as unknown as CreatorProfile),
      price_list: parsePriceList(record.price_list),
      portfolio_items: ((record.portfolio_items as PortfolioItem[]) ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    };
  });
}

export async function getPendingPortfolioItems(): Promise<
  (PortfolioItem & { creator: Pick<CreatorProfile, "studio_name" | "slug"> })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select(`id, title, description, embed_url, embed_type, thumbnail_url, style_tags, status, created_at, creator_profiles(studio_name, slug, verification_status)`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .filter((row) => {
      const record = row as Record<string, unknown>;
      const creator = record.creator_profiles as
        | { verification_status?: string }
        | null
        | undefined;
      return creator?.verification_status === "approved";
    }).map((row) => {
    const record = row as Record<string, unknown>;
    const creator = record.creator_profiles as Pick<CreatorProfile, "studio_name" | "slug">;
    const item = record as unknown as PortfolioItem;
    return { ...item, creator };
  });
}

export interface PublishedCreator extends CreatorProfile {
  portfolio_items: PortfolioItem[];
}

export async function getPublishedCreators(): Promise<PublishedCreator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(`${PUBLISHED_CREATOR_FIELDS}, portfolio_items(id, title, status, sort_order, creator_id)`)
    .eq("verification_status", "approved")
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      ...(record as unknown as CreatorProfile),
      price_list: parsePriceList(record.price_list),
      is_listed: record.is_listed !== false,
      portfolio_items: ((record.portfolio_items as PortfolioItem[]) ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    };
  });
}
