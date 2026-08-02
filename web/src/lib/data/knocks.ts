import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export type CreatorKnockStats = {
  total: number;
  thisWeek: number;
  thisMonth: number;
};

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getCreatorKnockStats(creatorId: string): Promise<CreatorKnockStats> {
  if (!isSupabaseConfigured()) {
    return { total: 0, thisWeek: 0, thisMonth: 0 };
  }

  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfWeek(now).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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
