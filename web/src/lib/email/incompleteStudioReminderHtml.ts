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
  <h1 style="font-size: 22px; margin-bottom: 16px;">工作室再補一點，會好很多</h1>
  <p>嗨，<strong>${escapeHtml(params.studioName)}</strong>：</p>
  <p>最近發案者開始在 Vigo 上逛了。你的帳號已經在，可是頁面還有點空，對方敲門進來可能不知道你擅長什麼。</p>
  <p>我們看了一下，目前比較缺的是：</p>
  <ul>${items}</ul>
  <p>不用一次做到完美。介紹寫清楚、掛上至少 3 支能點開的 YouTube／Reels，再留一個聯絡方式，就已經差很多。</p>
  <p style="margin: 24px 0 8px;">
    ${emailCta(params.studioEditUrl, "去補工作室")}
    ${emailCta(params.dashboardUrl, "回後台")}
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}
