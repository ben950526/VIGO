import { buildApprovalEmailHtml } from "@/lib/email/approvalEmailHtml";
import { siteUrl } from "@/lib/email/config";
import { dispatchEmail } from "@/lib/email/dispatchEmail";
import { buildReferralRegisterUrl } from "@/lib/referral/config";

export async function sendCreatorApprovalEmail(params: {
  to: string;
  studioName: string;
  slug: string;
  inviteCode?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = siteUrl();
  const inviteCode = params.inviteCode?.trim() || null;
  const referralUrl = inviteCode ? buildReferralRegisterUrl(baseUrl, inviteCode) : null;

  return dispatchEmail({
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
}
