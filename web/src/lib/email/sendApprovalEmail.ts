import { Resend } from "resend";
import { buildApprovalEmailHtml } from "@/lib/email/approvalEmailHtml";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://vigo-woad.vercel.app";
}

function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Vigo <notify@mail.try-vigo.com>";
}

export async function sendCreatorApprovalEmail(params: {
  to: string;
  studioName: string;
  slug: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping approval email");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const baseUrl = siteUrl();
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: params.to,
    subject: `【Vigo】你的工作室「${params.studioName}」已審核通過`,
    html: buildApprovalEmailHtml({
      studioName: params.studioName,
      creatorUrl: `${baseUrl}/creator/${params.slug}`,
      dashboardUrl: `${baseUrl}/dashboard`,
    }),
  });

  if (error) {
    console.error("[email] approval email failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
