import { createClient } from "@/lib/supabase/server";
import { startOfTaipeiWeek } from "@/lib/time/taipei";
import { isSupabaseConfigured } from "@/lib/utils";

export type CreatorKnockStats = {
  total: number;
  thisWeek: number;
  thisMonth: number;
};

export async function getCreatorKnockStats(creatorId: string): Promise<CreatorKnockStats> {
  if (!isSupabaseConfigured()) {
    return { total: 0, thisWeek: 0, thisMonth: 0 };
  }

  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfTaipeiWeek(now).toISOString();
  const monthStart = new Date(
    `${now.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }).slice(0, 7)}-01T00:00:00+08:00`,
  ).toISOString();

  const [totalRes, weekRes, monthRes] = await Promise.all([
    supabase
      .from("knocks")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId),
    supabase
      .from("knocks")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .gte("created_at", weekStart),
    supabase
      .from("knocks")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .gte("created_at", monthStart),
  ]);

  return {
    total: totalRes.count ?? 0,
    thisWeek: weekRes.count ?? 0,
    thisMonth: monthRes.count ?? 0,
  };
}
