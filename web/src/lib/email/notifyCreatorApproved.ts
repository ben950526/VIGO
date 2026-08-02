import type { SupabaseClient } from "@supabase/supabase-js";
import { sendCreatorApprovalEmail } from "@/lib/email/sendApprovalEmail";
import type { Database } from "@/types/supabase";

export type CreatorApprovalSnapshot = {
  verification_status: string;
  studio_name: string;
  slug: string;
  is_demo: boolean;
  profiles: { email: string } | { email: string }[] | null;
};

function profileEmail(profiles: CreatorApprovalSnapshot["profiles"]): string | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) return profiles[0]?.email ?? null;
  return profiles.email;
}

export async function loadCreatorApprovalSnapshot(
  supabase: SupabaseClient<Database>,
  creatorId: string,
): Promise<CreatorApprovalSnapshot | null> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select("verification_status, studio_name, slug, is_demo, profiles(email)")
    .eq("id", creatorId)
    .maybeSingle();

  if (error) {
    console.error("[email] could not load creator for notification:", error.message);
    return null;
  }

  return data as CreatorApprovalSnapshot | null;
}

/** 審核前快照為 pending 時寄信；失敗不拋錯，不影響審核結果 */
export async function notifyCreatorApprovedFromPending(
  before: CreatorApprovalSnapshot | null,
): Promise<void> {
  if (!before || before.verification_status !== "pending" || before.is_demo) return;

  const to = profileEmail(before.profiles);
  if (!to) {
    console.warn("[email] no profile email for studio:", before.studio_name);
    return;
  }

  await sendCreatorApprovalEmail({
    to,
    studioName: before.studio_name,
    slug: before.slug,
  });
}
