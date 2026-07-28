import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { CreatorProfile, CreatorWithPortfolio, PortfolioItem } from "@/types/database";
import { CREATOR_LIST_TAG } from "@/lib/cache/revalidate";
import { getAuthProfile, getAuthUserId, isAdminProfile } from "@/lib/auth/session";
import { isDemoCreator } from "@/lib/demo-creator";
import { parsePriceList } from "@/lib/price-list";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured, normalizeSlugParam } from "@/lib/utils";

const CREATOR_CARD_FIELDS =
  "id, slug, studio_name, avatar_url, region, style_tags, service_types, bio, price_min, price_max, featured, is_demo, verification_status, is_listed";

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

function mapCreatorListRow(row: Record<string, unknown>): CreatorWithPortfolio {
  return {
    ...normalizeCreator(row),
    portfolio_items: [],
  };
}

type CreatorFilters = {
  region?: string;
  styleTag?: string;
  serviceType?: string;
  query?: string;
};

function applyCreatorFilters(
  creators: CreatorWithPortfolio[],
  filters?: CreatorFilters,
): CreatorWithPortfolio[] {
  let result = creators;

  if (filters?.styleTag) {
    result = result.filter((c) => c.style_tags.includes(filters.styleTag!));
  }
  if (filters?.serviceType) {
    result = result.filter((c) => c.service_types.includes(filters.serviceType!));
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    result = result.filter((c) => {
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

  result.sort((a, b) => {
    const aDemo = isDemoCreator(a) ? 1 : 0;
    const bDemo = isDemoCreator(b) ? 1 : 0;
    if (aDemo !== bDemo) return aDemo - bDemo;
    return 0;
  });

  return result;
}

async function fetchApprovedCreators(filters?: CreatorFilters): Promise<CreatorWithPortfolio[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  let query = supabase
    .from("creator_profiles")
    .select(CREATOR_CARD_FIELDS)
    .eq("verification_status", "approved")
    .eq("is_listed", true)
    .order("featured", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters?.region) query = query.eq("region", filters.region);

  const { data, error } = await query;
  if (error || !data) return [];

  const creators = data.map((row) => mapCreatorListRow(row as Record<string, unknown>));
  return applyCreatorFilters(creators, filters);
}

export async function getApprovedCreators(
  filters?: CreatorFilters,
): Promise<CreatorWithPortfolio[]> {
  const cacheKey = JSON.stringify(filters ?? {});

  return unstable_cache(() => fetchApprovedCreators(filters), ["approved-creators", cacheKey], {
    revalidate: 120,
    tags: [CREATOR_LIST_TAG],
  })();
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

async function fetchPublicCreatorPage(slug: string): Promise<CreatorPageData | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("creator_profiles")
    .select("*, portfolio_items(*)")
    .eq("slug", slug)
    .eq("verification_status", "approved")
    .eq("is_listed", true)
    .maybeSingle();

  if (error || !data) return null;

  return { creator: mapCreatorRow(data as Record<string, unknown>) };
}

function getCachedPublicCreatorPage(slug: string): Promise<CreatorPageData | null> {
  return unstable_cache(
    () => fetchPublicCreatorPage(slug),
    ["creator-page-public", slug],
    { revalidate: 120, tags: [CREATOR_LIST_TAG] },
  )();
}

export const getCreatorPageBySlug = cache(
  async (slug: string): Promise<CreatorPageData | null> => {
    if (!isSupabaseConfigured()) return null;

    const normalizedSlug = normalizeSlugParam(slug);

    const publicPage = await getCachedPublicCreatorPage(normalizedSlug);
    if (publicPage) return publicPage;

    const supabase = await createClient();
    const [userId, authProfile, { data, error }] = await Promise.all([
      getAuthUserId(),
      getAuthProfile(),
      supabase
        .from("creator_profiles")
        .select("*, portfolio_items(*)")
        .eq("slug", normalizedSlug)
        .maybeSingle(),
    ]);

    if (error || !data) return null;

    const record = data as Record<string, unknown>;
    const profile = normalizeCreator(record);
    const creator = mapCreatorRow(record);

    if (!userId) return null;

    const isOwner = userId === profile.user_id;
    if (!isOwner && !(authProfile && isAdminProfile(authProfile))) {
      return null;
    }

    let previewReason: StudioPreviewReason;
    if (!isOwner) previewReason = "admin";
    else if (profile.verification_status === "pending") previewReason = "pending";
    else if (profile.verification_status === "rejected") previewReason = "rejected";
    else previewReason = "unlisted";

    return { creator, previewReason };
  },
);

async function fetchFeaturedCreators(): Promise<CreatorWithPortfolio[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(CREATOR_CARD_FIELDS)
    .eq("verification_status", "approved")
    .eq("is_listed", true)
    .order("featured", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(24);

  if (error || !data) return [];

  const creators = data.map((row) => mapCreatorListRow(row as Record<string, unknown>));
  const featured = creators.filter((c) => c.featured);
  const rest = creators.filter((c) => !c.featured);
  const sorted = [...featured, ...rest];

  sorted.sort((a, b) => {
    const aDemo = isDemoCreator(a) ? 1 : 0;
    const bDemo = isDemoCreator(b) ? 1 : 0;
    if (aDemo !== bDemo) return aDemo - bDemo;
    return 0;
  });

  return sorted.slice(0, 12);
}

export async function getFeaturedCreators(): Promise<CreatorWithPortfolio[]> {
  return unstable_cache(fetchFeaturedCreators, ["featured-creators"], {
    revalidate: 120,
    tags: [CREATOR_LIST_TAG],
  })();
}

export const getCurrentUserCreatorProfile = cache(async (): Promise<CreatorProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  const userId = await getAuthUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data ? normalizeCreator(data as Record<string, unknown>) : null;
});

export async function getCurrentUserPortfolio(): Promise<PortfolioItem[]> {
  if (!isSupabaseConfigured()) return [];

  const profile = await getCurrentUserCreatorProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_items")
    .select("id, title, status, sort_order, embed_url, embed_type, thumbnail_url, style_tags, creator_id")
    .eq("creator_id", profile.id)
    .order("sort_order", { ascending: true });

  return (data as PortfolioItem[]) ?? [];
}
