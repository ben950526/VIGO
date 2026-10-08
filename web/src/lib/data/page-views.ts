import { createClient } from "@/lib/supabase/server";
import { startOfTaipeiWeek } from "@/lib/time/taipei";
import { isSupabaseConfigured } from "@/lib/utils";

export type CreatorViewStats = {
  uniqueTotal: number;
  uniqueThisWeek: number;
  uniqueThisMonth: number;
};

function uniqueKeys(rows: { visitor_key: string; created_at: string }[], sinceIso?: string): number {
  const keys = new Set<string>();
  for (const row of rows) {
    if (sinceIso && row.created_at < sinceIso) continue;
    keys.add(row.visitor_key);
  }
  return keys.size;
}

export async function getCreatorViewStats(creatorId: string): Promise<CreatorViewStats> {
  if (!isSupabaseConfigured()) {
    return { uniqueTotal: 0, uniqueThisWeek: 0, uniqueThisMonth: 0 };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studio_page_views")
    .select("visitor_key, created_at")
    .eq("creator_id", creatorId);

  if (error || !data) {
    return { uniqueTotal: 0, uniqueThisWeek: 0, uniqueThisMonth: 0 };
  }

  const now = new Date();
  const weekStart = startOfTaipeiWeek(now).toISOString();
  const monthStart = new Date(
    `${now.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }).slice(0, 7)}-01T00:00:00+08:00`,
  ).toISOString();

  return {
    uniqueTotal: uniqueKeys(data),
    uniqueThisWeek: uniqueKeys(data, weekStart),
    uniqueThisMonth: uniqueKeys(data, monthStart),
  };
}
