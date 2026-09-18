import { createClient } from "@/lib/supabase/server";

export type AwardReferralResult =
  | { ok: true; creditsAwarded: number }
  | { ok: false; reason: string };

export async function awardReferralSignup(
  referredUserId: string,
  referrerSlug: string | null | undefined,
): Promise<AwardReferralResult> {
  const slug = referrerSlug?.trim();
  if (!slug) {
    return { ok: false, reason: "no_ref" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("award_referral_for_signup", {
    p_referred_user_id: referredUserId,
    p_referrer_slug: slug,
  });

  if (error) {
    return { ok: false, reason: error.message };
  }

  const payload = data as { ok?: boolean; reason?: string; credits_awarded?: number } | null;
  if (!payload?.ok) {
    return { ok: false, reason: payload?.reason ?? "unknown" };
  }

  return { ok: true, creditsAwarded: payload.credits_awarded ?? 0 };
}
