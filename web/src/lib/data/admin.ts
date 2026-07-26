import type { CreatorProfile, PortfolioItem } from "@/types/database";
import { parsePriceList } from "@/lib/price-list";
import { createClient } from "@/lib/supabase/server";

export interface PendingCreator extends CreatorProfile {
  portfolio_items: PortfolioItem[];
}

export async function getPendingCreators(): Promise<PendingCreator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_profiles")
    .select("*, portfolio_items(*)")
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
    .select("*, creator_profiles(studio_name, slug, verification_status)")
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
    })
    .map((row) => {
      const record = row as Record<string, unknown>;
      const creator = record.creator_profiles as Pick<
        CreatorProfile,
        "studio_name" | "slug"
      >;
      const item = record as unknown as PortfolioItem;
      return {
        ...item,
        creator,
      };
    });
}

export interface PublishedCreator extends CreatorProfile {
  portfolio_items: PortfolioItem[];
}

export async function getPublishedCreators(): Promise<PublishedCreator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_profiles")
    .select("*, portfolio_items(*)")
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
