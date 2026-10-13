import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailCta } from "@/lib/email/emailVoice";

function withLineBreaks(value: string): string {
  return escapeHtml(value).replace(/\r\n/g, "\n").replace(/\n/g, "<br/>");
}

export function buildBugFixedEmailHtml(params: {
  reportMessage: string;
  retrySteps: string;
  retryUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">你回報的問題已修好</h1>
  <p>嗨，謝謝你跟我們說。這個狀況已經修好了，請用下面步驟再試一次。</p>
  <p style="margin: 20px 0 8px; font-size: 13px; color: #64748b;">你當時回報的內容</p>
  <p style="background: #f8fafc; border-radius: 8px; padding: 12px 16px;">${withLineBreaks(params.reportMessage)}</p>
  <p style="margin: 24px 0 8px; font-weight: 600;">請這樣再試一次</p>
  <p>${withLineBreaks(params.retrySteps)}</p>
  <p style="margin: 24px 0;">
    ${emailCta(params.retryUrl, "打開頁面再試")}
  </p>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">這封信是因為你在 Vigo 回報過問題才寄的。若還是不對，直接回這封信或再到網站回報即可。</p>
</body>
</html>`;
}
