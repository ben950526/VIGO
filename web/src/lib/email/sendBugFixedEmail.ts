import { adminNotifyEmail, siteUrl } from "@/lib/email/config";
import { dispatchEmail } from "@/lib/email/dispatchEmail";
import { buildBugFixedEmailHtml } from "@/lib/email/bugFixedEmailHtml";

function retryUrlFromPage(pageUrl: string | null | undefined): string {
  const base = siteUrl();
  const fallback = `${base}/dashboard/studio`;
  const raw = pageUrl?.trim();
  if (!raw) return fallback;

  try {
    const parsed = raw.startsWith("/")
      ? new URL(raw, `${base}/`)
      : new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }
    return parsed.toString();
  } catch {
    return fallback;
  }
}

export async function sendBugFixedEmail(params: {
  to: string;
  reportMessage: string;
  retrySteps: string;
  pageUrl?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return dispatchEmail({
    to: params.to,
    replyTo: adminNotifyEmail() ?? undefined,
    subject: "【Vigo】抱歉造成困擾，問題已修好，請再試一次",
    html: buildBugFixedEmailHtml({
      reportMessage: params.reportMessage,
      retrySteps: params.retrySteps,
      retryUrl: retryUrlFromPage(params.pageUrl),
    }),
  });
}
