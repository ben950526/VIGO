import { Resend } from "resend";
import { emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";
import { buildWelcomeEmailHtml, WELCOME_EMAIL_SUBJECT } from "@/lib/email/welcomeEmailHtml";
import { buildReferralRegisterUrl } from "@/lib/referral/config";

export async function sendCreatorWelcomeEmail(params: {
  to: string;
  studioName: string;
  inviteCode: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping welcome email");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const baseUrl = siteUrl();
  const inviteCode = params.inviteCode?.trim() || null;
  const referralUrl = inviteCode ? buildReferralRegisterUrl(baseUrl, inviteCode) : null;

  const resend = new Resend(apiKey);
  const sendResult = await Promise.race([
    resend.emails.send({
      from: emailFrom(),
      to: params.to,
      subject: WELCOME_EMAIL_SUBJECT,
      html: buildWelcomeEmailHtml({
        studioName: params.studioName,
        inviteCode,
        referralUrl,
        studioEditUrl: `${baseUrl}/dashboard/studio`,
        portfolioUrl: `${baseUrl}/dashboard/portfolio/new`,
        dashboardUrl: `${baseUrl}/dashboard`,
        termsUrl: `${baseUrl}/terms#promo-credits`,
      }),
    }),
    new Promise<{ error: { message: string } }>((resolve) => {
      setTimeout(() => resolve({ error: { message: "welcome email timed out" } }), 8000);
    }),
  ]);

  if (sendResult.error) {
    console.error("[email] welcome email failed:", sendResult.error);
    return { ok: false, error: sendResult.error.message };
  }

  return { ok: true };
}
