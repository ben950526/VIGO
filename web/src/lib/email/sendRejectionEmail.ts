import { Resend } from "resend";
import { buildRejectionEmailHtml } from "@/lib/email/rejectionEmailHtml";
import { emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";

export async function sendCreatorRejectionEmail(params: {
  to: string;
  studioName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping rejection email");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const baseUrl = siteUrl();
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: params.to,
    subject: `【Vigo】你的工作室「${params.studioName}」審核未通過`,
    html: buildRejectionEmailHtml({
      studioName: params.studioName,
      profileUrl: `${baseUrl}/dashboard/profile`,
      dashboardUrl: `${baseUrl}/dashboard`,
    }),
  });

  if (error) {
    console.error("[email] rejection email failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
