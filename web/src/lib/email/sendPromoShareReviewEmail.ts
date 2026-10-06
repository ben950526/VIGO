import { siteUrl } from "@/lib/email/config";
import { dispatchEmail } from "@/lib/email/dispatchEmail";
import {
  buildPromoShareApprovedEmailHtml,
  buildPromoShareRejectedEmailHtml,
} from "@/lib/email/promoShareReviewEmailHtml";

export async function sendPromoShareApprovedEmail(params: {
  to: string;
  studioName: string;
  creditsAwarded: number;
  postUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = siteUrl();
  return dispatchEmail({
    to: params.to,
    subject: `【Vigo】宣傳貼文通過了${params.creditsAwarded > 0 ? `，已幫你加上 ${params.creditsAwarded} 點` : ""}`,
    html: buildPromoShareApprovedEmailHtml({
      studioName: params.studioName,
      creditsAwarded: params.creditsAwarded,
      postUrl: params.postUrl,
      dashboardUrl: `${baseUrl}/dashboard`,
    }),
  });
}

export async function sendPromoShareRejectedEmail(params: {
  to: string;
  studioName: string;
  postUrl: string;
  adminNote?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = siteUrl();
  return dispatchEmail({
    to: params.to,
    subject: `【Vigo】宣傳貼文這次還沒過`,
    html: buildPromoShareRejectedEmailHtml({
      studioName: params.studioName,
      postUrl: params.postUrl,
      adminNote: params.adminNote ?? null,
      dashboardUrl: `${baseUrl}/dashboard`,
    }),
  });
}
