"use server";

import { sendCreatorWelcomeEmail } from "@/lib/email/sendWelcomeEmail";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/** 註冊成功後由 client 呼叫；失敗只記 log，不影響註冊 */
export async function sendCreatorWelcomeAfterSignup(params: {
  email: string;
  studioName: string;
  slug: string;
}): Promise<void> {
  const email = params.email.trim().toLowerCase();
  const slug = params.slug.trim();
  const studioName = params.studioName.trim();
  if (!email || !slug || !studioName) return;

  try {
    const inviteCode = await resolveInviteCodeForWelcome({ email, slug });
    await sendCreatorWelcomeEmail({
      to: email,
      studioName,
      inviteCode,
    });
  } catch (err) {
    console.error("[email] welcome after signup:", err);
  }
}

async function resolveInviteCodeForWelcome(params: {
  email: string;
  slug: string;
}): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase
      .from("creator_profiles")
      .select("invite_code, contact_email")
      .eq("user_id", user.id)
      .maybeSingle();

    const contact = data?.contact_email?.trim().toLowerCase();
    if (data && contact === params.email) {
      const code = data.invite_code?.trim();
      return code || null;
    }
  }

  const admin = createServiceClient();
  if (!admin) return null;

  const { data } = await admin
    .from("creator_profiles")
    .select("invite_code, contact_email, slug")
    .eq("slug", params.slug)
    .maybeSingle();

  const contact = data?.contact_email?.trim().toLowerCase();
  if (!data || contact !== params.email) return null;
  return data.invite_code?.trim() || null;
}
