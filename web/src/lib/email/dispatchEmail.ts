import { Resend } from "resend";
import { adminBccFor, emailFrom, resendApiKey } from "@/lib/email/config";

export async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping send:", params.subject);
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const to = params.to.trim();
  if (!to) {
    return { ok: false, error: "找不到收件 Email" };
  }

  const bcc = adminBccFor(to);
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to,
    subject: params.subject,
    html: params.html,
    ...(bcc ? { bcc } : {}),
  });

  if (error) {
    console.error("[email] send failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
