import { buildApprovalEmailHtml } from "@/lib/email/approvalEmailHtml";
import { siteUrl } from "@/lib/email/config";
import { dispatchEmail } from "@/lib/email/dispatchEmail";
import { buildReferralRegisterUrl } from "@/lib/referral/config";

export async function sendCreatorApprovalEmail(params: {
  to: string;
  studioName: string;
  slug: string;
  inviteCode?: string | null;
  exploreGaps?: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = siteUrl();
  const inviteCode = params.inviteCode?.trim() || null;
  const referralUrl = inviteCode ? buildReferralRegisterUrl(baseUrl, inviteCode) : null;
  const exploreGaps = params.exploreGaps ?? [];
  const subject =
    exploreGaps.length === 0
      ? `【Vigo】恭喜，「${params.studioName}」已出現在探索頁`
      : `【Vigo】「${params.studioName}」已通過審核，還差一點才會出現在探索頁`;

  return dispatchEmail({
    to: params.to,
    subject,
    html: buildApprovalEmailHtml({
      studioName: params.studioName,
      creatorUrl: `${baseUrl}/creator/${params.slug}`,
      dashboardUrl: `${baseUrl}/dashboard`,
      studioEditUrl: `${baseUrl}/dashboard/studio`,
      portfolioUrl: `${baseUrl}/dashboard/portfolio/new`,
      termsUrl: `${baseUrl}/terms#promo-credits`,
      inviteCode,
      referralUrl,
      exploreGaps,
    }),
  });
}
