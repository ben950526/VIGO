import { siteUrl } from "@/lib/email/config";
import { dispatchEmail } from "@/lib/email/dispatchEmail";
import {
  buildPortfolioApprovedEmailHtml,
  buildPortfolioRejectedEmailHtml,
} from "@/lib/email/portfolioReviewEmailHtml";

export async function sendPortfolioApprovedEmail(params: {
  to: string;
  studioName: string;
  slug: string;
  workTitle: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = siteUrl();
  return dispatchEmail({
    to: params.to,
    subject: `【Vigo】作品「${params.workTitle}」已審核通過`,
    html: buildPortfolioApprovedEmailHtml({
      studioName: params.studioName,
      workTitle: params.workTitle,
      creatorUrl: `${baseUrl}/creator/${params.slug}`,
      dashboardUrl: `${baseUrl}/dashboard`,
    }),
  });
}

export async function sendPortfolioRejectedEmail(params: {
  to: string;
  studioName: string;
  workTitle: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = siteUrl();
  return dispatchEmail({
    to: params.to,
    subject: `【Vigo】作品「${params.workTitle}」審核未通過`,
    html: buildPortfolioRejectedEmailHtml({
      studioName: params.studioName,
      workTitle: params.workTitle,
      studioEditUrl: `${baseUrl}/dashboard/studio`,
    }),
  });
}
