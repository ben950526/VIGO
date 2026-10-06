import type { SupabaseClient } from "@supabase/supabase-js";
import { sendCreatorApprovalEmail } from "@/lib/email/sendApprovalEmail";
import { sendCreatorRejectionEmail } from "@/lib/email/sendRejectionEmail";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/supabase";

export type CreatorReviewSnapshot = {
  verification_status: string;
  studio_name: string;
  slug: string;
  is_demo: boolean;
  invite_code: string | null;
  contact_email: string | null;
  user_id: string;
};

/** @deprecated */
export type CreatorApprovalSnapshot = CreatorReviewSnapshot;

async function resolveNotifyEmail(snapshot: CreatorReviewSnapshot): Promise<string | null> {
  const contact = snapshot.contact_email?.trim();
  if (contact) return contact;

  const service = createServiceClient();
  if (!service) return null;
  const { data, error } = await service.auth.admin.getUserById(snapshot.user_id);
  if (error) {
    console.error("[email] getUserById failed:", error.message);
    return null;
  }
  return data.user?.email?.trim() || null;
}

export async function loadCreatorReviewSnapshot(
  supabase: SupabaseClient<Database>,
  creatorId: string,
): Promise<CreatorReviewSnapshot | null> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select("user_id, verification_status, studio_name, slug, is_demo, invite_code, contact_email")
    .eq("id", creatorId)
    .maybeSingle();

  if (error) {
    console.error("[email] could not load creator for notification:", error.message);
    return null;
  }

  return data as CreatorReviewSnapshot | null;
}

/** @deprecated */
export const loadCreatorApprovalSnapshot = loadCreatorReviewSnapshot;

export async function notifyCreatorApprovedFromPending(
  before: CreatorReviewSnapshot | null,
): Promise<void> {
  if (!before || before.is_demo) return;
  if (before.verification_status === "approved") return;

  const to = await resolveNotifyEmail(before);
  if (!to) {
    console.warn("[email] no profile email for studio:", before.studio_name);
    return;
  }

  const result = await sendCreatorApprovalEmail({
    to,
    studioName: before.studio_name,
    slug: before.slug,
    inviteCode: before.invite_code,
  });
  if (!result.ok) {
    console.error("[email] approval send failed:", result.error);
  }
}

export async function notifyCreatorRejectedFromPending(
  before: CreatorReviewSnapshot | null,
): Promise<void> {
  if (!before || before.verification_status !== "pending" || before.is_demo) return;

  const to = await resolveNotifyEmail(before);
  if (!to) {
    console.warn("[email] no profile email for studio:", before.studio_name);
    return;
  }

  const result = await sendCreatorRejectionEmail({
    to,
    studioName: before.studio_name,
  });
  if (!result.ok) {
    console.error("[email] rejection send failed:", result.error);
  }
}

/** 已通過者補寄（不看審核前狀態） */
export async function sendApprovalEmailForCreator(
  snapshot: CreatorReviewSnapshot,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (snapshot.is_demo) {
    return { ok: false, error: "示範帳號不寄信" };
  }
  const to = await resolveNotifyEmail(snapshot);
  if (!to) {
    return { ok: false, error: "找不到收件 Email" };
  }
  return sendCreatorApprovalEmail({
    to,
    studioName: snapshot.studio_name,
    slug: snapshot.slug,
    inviteCode: snapshot.invite_code,
  });
}
