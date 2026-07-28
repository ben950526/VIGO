import { cache } from "react";
import { getCurrentUserProfile } from "@/lib/auth/admin";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: row }, profileRecord] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select("*, portfolio_items(id, title, status, sort_order)")
      .eq("user_id", user.id)
      .single(),
    getCurrentUserProfile(),
  ]);

  if (!row) return null;

  const record = row as Record<string, unknown>;
  const profile = normalizeCreator(record);
  const portfolio = ((record.portfolio_items as PortfolioItem[]) ?? []).sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const emailMatch = adminEmail && profileRecord?.email.toLowerCase() === adminEmail;
  const isAdmin = profileRecord?.role === "admin" || Boolean(emailMatch);

  return { profile, portfolio, isAdmin };
});
