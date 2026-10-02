import { Resend } from "resend";
import { buildAccountPurgedEmailHtml } from "@/lib/email/accountPurgedEmailHtml";
import { emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";

export async function sendAccountPurgedEmail(params: {
  to: string;
  studioName: string;
  reason?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping purge email");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const baseUrl = siteUrl();
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: params.to,
    subject: `【Vigo】你的工作室「${params.studioName}」帳號已註銷`,
    html: buildAccountPurgedEmailHtml({
      studioName: params.studioName,
      reason: params.reason?.trim() || null,
      registerUrl: `${baseUrl}/register`,
      feedbackUrl: `${baseUrl}/feedback`,
    }),
  });

  if (error) {
    console.error("[email] purge email failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
