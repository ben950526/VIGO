"use server";

import { after } from "next/server";
import { sendCreatorWelcomeEmail } from "@/lib/email/sendWelcomeEmail";
import { createServiceClient } from "@/lib/supabase/service";

/** 立刻返回，寄信放到 after()，避免註冊畫面卡在「建立中」 */
export async function sendCreatorWelcomeAfterSignup(params: {
  email: string;
  studioName: string;
  slug: string;
}): Promise<void> {
  const email = params.email.trim().toLowerCase();
  const slug = params.slug.trim();
  const studioName = params.studioName.trim();
  if (!email || !slug || !studioName) return;

  after(async () => {
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
  });
}

async function resolveInviteCodeForWelcome(params: {
  email: string;
  slug: string;
}): Promise<string | null> {
  const admin = createServiceClient();
  if (!admin) return null;

  const { data } = await admin
    .from("creator_profiles")
    .select("invite_code, contact_email")
    .eq("slug", params.slug)
    .maybeSingle();

  const contact = data?.contact_email?.trim().toLowerCase();
  if (!data || contact !== params.email) return null;
  return data.invite_code?.trim() || null;
}
