import { Resend } from "resend";
import { buildApprovalEmailHtml } from "@/lib/email/approvalEmailHtml";
import { emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";
import { buildReferralRegisterUrl } from "@/lib/referral/config";

export async function sendCreatorApprovalEmail(params: {
  to: string;
  studioName: string;
  slug: string;
  inviteCode?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping approval email");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const baseUrl = siteUrl();
  const inviteCode = params.inviteCode?.trim() || null;
  const referralUrl = inviteCode ? buildReferralRegisterUrl(baseUrl, inviteCode) : null;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: params.to,
    subject: `【Vigo】你的工作室「${params.studioName}」已審核通過`,
    html: buildApprovalEmailHtml({
      studioName: params.studioName,
      creatorUrl: `${baseUrl}/creator/${params.slug}`,
      dashboardUrl: `${baseUrl}/dashboard`,
      studioEditUrl: `${baseUrl}/dashboard/studio`,
      portfolioUrl: `${baseUrl}/dashboard/portfolio/new`,
      termsUrl: `${baseUrl}/terms#promo-credits`,
      inviteCode,
      referralUrl,
    }),
  });

  if (error) {
    console.error("[email] approval email failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
