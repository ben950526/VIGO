import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendCreatorApprovalEmail } from "@/lib/email/sendApprovalEmail";
import { sendCreatorRejectionEmail } from "@/lib/email/sendRejectionEmail";
import type { Database } from "@/types/supabase";

export type CreatorReviewSnapshot = {
  verification_status: string;
  studio_name: string;
  slug: string;
  is_demo: boolean;
  invite_code: string | null;
  contact_email: string | null;
  profiles: { email: string } | { email: string }[] | null;
};

/** @deprecated */
export type CreatorApprovalSnapshot = CreatorReviewSnapshot;

function profileEmail(snapshot: CreatorReviewSnapshot): string | null {
  const nested = snapshot.profiles;
  const fromProfile = Array.isArray(nested) ? nested[0]?.email : nested?.email;
  const raw = fromProfile?.trim() || snapshot.contact_email?.trim() || "";
  return raw || null;
}

export async function loadCreatorReviewSnapshot(
  supabase: SupabaseClient<Database>,
  creatorId: string,
): Promise<CreatorReviewSnapshot | null> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(
      "verification_status, studio_name, slug, is_demo, invite_code, contact_email, profiles(email)",
    )
    .eq("id", creatorId)
    .maybeSingle();

  if (error) {
    console.error("[email] could not load creator for notification:", error.message);
    const { data: fallback } = await supabase
      .from("creator_profiles")
      .select("verification_status, studio_name, slug, is_demo, invite_code, contact_email")
      .eq("id", creatorId)
      .maybeSingle();
    if (!fallback) return null;
    return { ...fallback, profiles: null } as CreatorReviewSnapshot;
  }

  return data as CreatorReviewSnapshot | null;
}

/** @deprecated */
export const loadCreatorApprovalSnapshot = loadCreatorReviewSnapshot;

function shouldNotifyReviewChange(before: CreatorReviewSnapshot | null): before is CreatorReviewSnapshot {
  if (!before || before.is_demo) return false;
  return before.verification_status !== "approved";
}

/** 審核通過後寄信；after() 避免後台畫面卸載時中斷 Resend */
export async function notifyCreatorApprovedFromPending(
  before: CreatorReviewSnapshot | null,
): Promise<void> {
  if (!shouldNotifyReviewChange(before)) return;

  const to = profileEmail(before);
  if (!to) {
    console.warn("[email] no profile email for studio:", before.studio_name);
    return;
  }

  after(async () => {
    await sendCreatorApprovalEmail({
      to,
      studioName: before.studio_name,
      slug: before.slug,
      inviteCode: before.invite_code,
    });
  });
}

export async function notifyCreatorRejectedFromPending(
  before: CreatorReviewSnapshot | null,
): Promise<void> {
  if (!before || before.verification_status !== "pending" || before.is_demo) return;

  const to = profileEmail(before);
  if (!to) {
    console.warn("[email] no profile email for studio:", before.studio_name);
    return;
  }

  after(async () => {
    await sendCreatorRejectionEmail({
      to,
      studioName: before.studio_name,
    });
  });
}
