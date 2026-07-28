import { cache } from "react";
import { getAuthProfile, getAuthUserId, isAdminProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { CreatorProfile, PortfolioItem } from "@/types/database";
import { parsePriceList } from "@/lib/price-list";
import { isSupabaseConfigured } from "@/lib/utils";

function normalizeCreator(row: Record<string, unknown>): CreatorProfile {
  return {
    ...(row as unknown as CreatorProfile),
    platforms: (row.platforms as string[]) ?? [],
    client_types: (row.client_types as string[]) ?? [],
    languages: (row.languages as string[]) ?? [],
    price_list: parsePriceList(row.price_list),
    is_listed: row.is_listed !== false,
    is_demo: row.is_demo === true,
  };
}

export type DashboardData = {
  profile: CreatorProfile;
  portfolio: PortfolioItem[];
  isAdmin: boolean;
};

export const getDashboardData = cache(async (): Promise<DashboardData | null> => {
  if (!isSupabaseConfigured()) return null;

  const userId = await getAuthUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const [{ data: row }, authProfile] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select("*, portfolio_items(id, title, status, sort_order)")
      .eq("user_id", userId)
      .single(),
    getAuthProfile(),
  ]);

  if (!row) return null;

  const record = row as Record<string, unknown>;
  const profile = normalizeCreator(record);
  const portfolio = ((record.portfolio_items as PortfolioItem[]) ?? []).sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return {
    profile,
    portfolio,
    isAdmin: authProfile ? isAdminProfile(authProfile) : false,
  };
});

export const getDashboardProfile = cache(async (): Promise<CreatorProfile | null> => {
  const data = await getDashboardData();
  return data?.profile ?? null;
});
