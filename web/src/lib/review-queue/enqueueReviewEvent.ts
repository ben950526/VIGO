import type { AdminReviewNotifyKind } from "@/lib/email/adminReviewNotifyHtml";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/utils";

export async function enqueueReviewEvent(params: {
  kind: AdminReviewNotifyKind;
  studioName: string;
  slug: string;
  portfolioTitle?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const userId = await getAuthUserId();
  if (!userId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("review_submission_events").insert({
    kind: params.kind,
    studio_name: params.studioName.trim(),
    slug: params.slug.trim(),
    portfolio_title: params.portfolioTitle?.trim() || null,
    creator_user_id: userId,
  });

  if (error) {
    console.error("[review-queue] enqueue failed:", error.message);
  }
}
