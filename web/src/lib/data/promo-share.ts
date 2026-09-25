import { cache } from "react";
import { getAuthUserId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export type PromoSharePlatform = "threads" | "facebook" | "instagram" | "tiktok" | "other";
export type PromoShareStatus = "pending" | "approved" | "rejected";

export type PromoShareSubmission = {
  id: string;
  user_id: string;
  platform: PromoSharePlatform;
  post_url: string;
  status: PromoShareStatus;
  credits_awarded: number;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type PromoShareSubmissionWithCreator = PromoShareSubmission & {
  studio_name: string;
  slug: string;
};

export const getMyPromoShareSubmissions = cache(async (): Promise<PromoShareSubmission[]> => {
  if (!isSupabaseConfigured()) return [];

  const userId = await getAuthUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promo_share_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PromoShareSubmission[];
});

export async function getPendingPromoShareSubmissions(): Promise<PromoShareSubmissionWithCreator[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promo_share_submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !data?.length) return [];

  const submissions = data as PromoShareSubmission[];
  const userIds = [...new Set(submissions.map((s) => s.user_id))];
  const { data: creators } = await supabase
    .from("creator_profiles")
    .select("user_id, studio_name, slug")
    .in("user_id", userIds);

  const byUser = new Map(
    (creators ?? []).map((c) => [c.user_id, { studio_name: c.studio_name, slug: c.slug }]),
  );

  return submissions.map((s) => {
    const cp = byUser.get(s.user_id);
    return {
      ...s,
      studio_name: cp?.studio_name ?? "（未知）",
      slug: cp?.slug ?? "",
    };
  });
}
