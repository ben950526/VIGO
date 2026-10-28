import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { startOfTaipeiWeek } from "@/lib/time/taipei";
import { isSupabaseConfigured } from "@/lib/utils";

export type CreatorViewStats = {
  uniqueTotal: number;
  uniqueThisWeek: number;
  uniqueThisMonth: number;
};

function uniqueKeys(
  rows: { visitor_key: string; created_at: string; from_admin?: boolean | null }[],
  options?: { sinceIso?: string; excludeVisitorKeys?: Set<string> },
): number {
  const keys = new Set<string>();
  for (const row of rows) {
    if (row.from_admin === true) continue;
    if (options?.excludeVisitorKeys?.has(row.visitor_key)) continue;
    if (options?.sinceIso && row.created_at < options.sinceIso) continue;
    keys.add(row.visitor_key);
  }
  return keys.size;
}

async function adminVisitorKeys(
  supabase: Awaited<ReturnType<typeof createClient>>,
  creatorId?: string,
): Promise<Set<string>> {
  let query = supabase.from("knocks").select("visitor_key").eq("from_admin", true);
  if (creatorId) query = query.eq("creator_id", creatorId);
  const { data, error } = await query;
  if (error?.message.includes("from_admin") || !data) return new Set();
  return new Set(data.map((row) => row.visitor_key).filter(Boolean));
}

export async function getCreatorViewStats(creatorId: string): Promise<CreatorViewStats> {
  if (!isSupabaseConfigured()) {
    return { uniqueTotal: 0, uniqueThisWeek: 0, uniqueThisMonth: 0 };
  }

  const supabase = createServiceClient() ?? (await createClient());
  let { data, error } = await supabase
    .from("studio_page_views")
    .select("visitor_key, created_at, from_admin")
    .eq("creator_id", creatorId);

  if (error?.message.includes("from_admin")) {
    const fallback = await supabase
      .from("studio_page_views")
      .select("visitor_key, created_at")
      .eq("creator_id", creatorId);
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return { uniqueTotal: 0, uniqueThisWeek: 0, uniqueThisMonth: 0 };
  }

  const excludeVisitorKeys = await adminVisitorKeys(supabase, creatorId);
  const now = new Date();
  const weekStart = startOfTaipeiWeek(now).toISOString();
  const monthStart = new Date(
    `${now.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }).slice(0, 7)}-01T00:00:00+08:00`,
  ).toISOString();

  return {
    uniqueTotal: uniqueKeys(data, { excludeVisitorKeys }),
    uniqueThisWeek: uniqueKeys(data, { sinceIso: weekStart, excludeVisitorKeys }),
    uniqueThisMonth: uniqueKeys(data, { sinceIso: monthStart, excludeVisitorKeys }),
  };
}
