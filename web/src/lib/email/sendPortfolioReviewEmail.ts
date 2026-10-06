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
    subject: `【Vigo】「${params.workTitle}」可以公開了`,
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
    subject: `【Vigo】「${params.workTitle}」這次先沒過`,
    html: buildPortfolioRejectedEmailHtml({
      studioName: params.studioName,
      workTitle: params.workTitle,
      studioEditUrl: `${baseUrl}/dashboard/studio`,
    }),
  });
}
