import type { CreatorProfile, PortfolioItem } from "@/types/database";
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

  return data.map((row) => ({
    ...(row as CreatorProfile),
    portfolio_items: (
      (row as { portfolio_items: PortfolioItem[] }).portfolio_items ?? []
    ).sort((a, b) => a.sort_order - b.sort_order),
  }));
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
      const creator = (
        row as { creator_profiles: { verification_status: string } }
      ).creator_profiles;
      return creator?.verification_status === "approved";
    })
    .map((row) => {
      const { creator_profiles, ...item } = row as PortfolioItem & {
        creator_profiles: Pick<CreatorProfile, "studio_name" | "slug">;
      };
      return {
        ...item,
        creator: creator_profiles,
      };
    });
}
