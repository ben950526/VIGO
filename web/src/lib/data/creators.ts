import type { CreatorProfile, CreatorWithPortfolio, PortfolioItem } from "@/types/database";
import { isDemoCreator } from "@/lib/demo-creator";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { parsePriceList } from "@/lib/price-list";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, normalizeSlugParam } from "@/lib/utils";

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

function mapCreatorRow(row: Record<string, unknown>): CreatorWithPortfolio {
  return {
    ...normalizeCreator(row),
    portfolio_items: ((row.portfolio_items as PortfolioItem[]) ?? [])
      .filter((item) => item.status === "approved")
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

function isPublicCreator(profile: CreatorProfile): boolean {
  return profile.verification_status === "approved" && profile.is_listed;
}

export async function getApprovedCreators(filters?: {
  region?: string;
  styleTag?: string;
  serviceType?: string;
  query?: string;
}): Promise<CreatorWithPortfolio[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  let query = supabase
    .from("creator_profiles")
    .select("*, portfolio_items(*)")
    .eq("verification_status", "approved")
    .order("featured", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters?.region) query = query.eq("region", filters.region);

  const { data, error } = await query;
  if (error || !data) return [];

  let creators = data
    .map((row) => mapCreatorRow(row as Record<string, unknown>))
    .filter((creator) => creator.is_listed);
  if (filters?.styleTag) {
    creators = creators.filter((c) => c.style_tags.includes(filters.styleTag!));
  }
  if (filters?.serviceType) {
    creators = creators.filter((c) =>
      c.service_types.includes(filters.serviceType!),
    );
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    creators = creators.filter((c) => {
      const haystack = [
        c.studio_name,
        c.bio ?? "",
        ...c.style_tags,
        ...c.service_types,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  creators.sort((a, b) => {
    const aDemo = isDemoCreator(a) ? 1 : 0;
    const bDemo = isDemoCreator(b) ? 1 : 0;
    if (aDemo !== bDemo) return aDemo - bDemo;
    return 0;
  });

  return creators;
}

export async function getCreatorBySlug(
  slug: string,
): Promise<CreatorWithPortfolio | null> {
  const page = await getCreatorPageBySlug(slug);
  if (!page || page.previewReason) return null;
  return page.creator;
}

export type StudioPreviewReason = "pending" | "unlisted" | "rejected" | "admin";

export interface CreatorPageData {
  creator: CreatorWithPortfolio;
  previewReason?: StudioPreviewReason;
}

export async function getCreatorPageBySlug(
  slug: string,
): Promise<CreatorPageData | null> {
  if (!isSupabaseConfigured()) return null;

  const normalizedSlug = normalizeSlugParam(slug);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("creator_profiles")
    .select("*, portfolio_items(*)")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error || !data) return null;

  const record = data as Record<string, unknown>;
  const profile = normalizeCreator(record);
  const creator = mapCreatorRow(record);
  const isOwner = user?.id === profile.user_id;
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  if (isPublicCreator(profile)) {
    return { creator };
  }

  if (!isOwner && !isAdmin) return null;

  let previewReason: StudioPreviewReason;
  if (isAdmin && !isOwner) previewReason = "admin";
  else if (profile.verification_status === "pending") previewReason = "pending";
  else if (profile.verification_status === "rejected") previewReason = "rejected";
  else previewReason = "unlisted";

  return { creator, previewReason };
}

export async function getFeaturedCreators(): Promise<CreatorWithPortfolio[]> {
  const creators = await getApprovedCreators();
  const featured = creators.filter((c) => c.featured);
  const rest = creators.filter((c) => !c.featured);
  return [...featured, ...rest].slice(0, 12);
}

export async function getCurrentUserCreatorProfile(): Promise<CreatorProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data ? normalizeCreator(data as Record<string, unknown>) : null;
}

export async function getCurrentUserPortfolio(): Promise<PortfolioItem[]> {
  if (!isSupabaseConfigured()) return [];

  const profile = await getCurrentUserCreatorProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("creator_id", profile.id)
    .order("sort_order", { ascending: true });

  return (data as PortfolioItem[]) ?? [];
}
