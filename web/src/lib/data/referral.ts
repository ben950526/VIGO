import { cache } from "react";
import { getAuthUserId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export type ReferralDashboardStats = {
  successfulInvites: number;
  creditsFromReferrals: number;
};

export const getReferralDashboardStats = cache(async (): Promise<ReferralDashboardStats | null> => {
  if (!isSupabaseConfigured()) return null;

  const userId = await getAuthUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("referral_signups")
    .select("credits_awarded")
    .eq("referrer_user_id", userId);

  if (error) return { successfulInvites: 0, creditsFromReferrals: 0 };

  const rows = data ?? [];
  const creditsFromReferrals = rows.reduce((sum, row) => sum + (row.credits_awarded ?? 0), 0);

  return {
    successfulInvites: rows.length,
    creditsFromReferrals,
  };
});
