import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";

export function buildIncompleteStudioReminderHtml(params: {
  studioName: string;
  missing: string[];
  studioEditUrl: string;
  dashboardUrl: string;
}): string {
  const items = params.missing
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">還差一點，就會出現在探索頁</h1>
  <p>嗨，<strong>${escapeHtml(params.studioName)}</strong>：</p>
  <p>你的工作室已經通過審核。帳號沒被下架，只是探索頁目前還看不到你，因為還差：</p>
  <ul>${items}</ul>
  <p>補上之後會自動出現，<strong>不用再送審一次</strong>。介紹大約 20 字、加上至少 1 支已通過的 YouTube 或 Reels 就夠。</p>
  <p style="margin: 24px 0 8px;">
    ${emailCta(params.studioEditUrl, "去補工作室")}
    ${emailCta(params.dashboardUrl, "回後台")}
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}
