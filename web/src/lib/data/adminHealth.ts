import { createClient } from "@/lib/supabase/server";
import { startOfTaipeiWeek } from "@/lib/time/taipei";
import { isSupabaseConfigured } from "@/lib/utils";

export type AdminHealthStats = {
  weekLabel: string;
  registrationsThisWeek: number;
  knocksThisWeek: number;
  uniqueViewsThisWeek: number;
  pendingCreators: number;
  pendingWorks: number;
  pendingPromo: number;
  approvedListed: number;
  feedbackThisWeek: number;
  bugsThisWeek: number;
};

export async function getAdminHealthStats(): Promise<AdminHealthStats> {
  const empty: AdminHealthStats = {
    weekLabel: "",
    registrationsThisWeek: 0,
    knocksThisWeek: 0,
    uniqueViewsThisWeek: 0,
    pendingCreators: 0,
    pendingWorks: 0,
    pendingPromo: 0,
    approvedListed: 0,
    feedbackThisWeek: 0,
    bugsThisWeek: 0,
  };

  if (!isSupabaseConfigured()) return empty;

  const now = new Date();
  const weekStart = startOfTaipeiWeek(now);
  const weekIso = weekStart.toISOString();
  const weekLabel = weekStart.toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
  });

  const supabase = await createClient();

  const [
    regRes,
    knockRes,
    viewRes,
    pendingCreatorRes,
    pendingWorkRes,
    pendingPromoRes,
    listedRes,
    feedbackRes,
    bugRes,
  ] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_demo", false)
      .gte("created_at", weekIso),
    supabase
      .from("knocks")
      .select("id, from_admin, user_agent")
      .gte("created_at", weekIso),
    supabase.from("studio_page_views").select("creator_id, visitor_key").gte("created_at", weekIso),
    supabase
      .from("creator_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending")
      .eq("is_demo", false),
    supabase.from("portfolio_items").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("promo_share_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("creator_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "approved")
      .eq("is_demo", false)
      .eq("is_listed", true),
    supabase.from("feedback").select("id", { count: "exact", head: true }).gte("created_at", weekIso),
    supabase
      .from("bug_reports")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekIso)
      .in("status", ["open", "investigating"]),
  ]);

  let knockRows: { from_admin?: boolean | null; user_agent?: string | null }[] | null =
    knockRes.data;
  let knockError = knockRes.error;
  if (knockError?.message.includes("from_admin")) {
    const fallback = await supabase.from("knocks").select("id, user_agent").gte("created_at", weekIso);
    knockRows = fallback.data;
    knockError = fallback.error;
  }

  const uniqueViews = new Set(
    (viewRes.data ?? []).map((row) => `${row.creator_id}:${row.visitor_key}`),
  ).size;

  return {
    weekLabel,
    registrationsThisWeek: regRes.count ?? 0,
    knocksThisWeek: countPublicKnocks(knockRows, knockError),
    uniqueViewsThisWeek: viewRes.error ? 0 : uniqueViews,
    pendingCreators: pendingCreatorRes.count ?? 0,
    pendingWorks: pendingWorkRes.count ?? 0,
    pendingPromo: pendingPromoRes.count ?? 0,
    approvedListed: listedRes.count ?? 0,
    feedbackThisWeek: feedbackRes.count ?? 0,
    bugsThisWeek: bugRes.count ?? 0,
  };
}

function countPublicKnocks(
  rows: { from_admin?: boolean | null; user_agent?: string | null }[] | null,
  error: { message: string } | null,
): number {
  if (error || !rows) return 0;
  return rows.filter((row) => {
    if (row.from_admin === true) return false;
    if (String(row.user_agent ?? "").startsWith("vigo-admin|")) return false;
    return true;
  }).length;
}
