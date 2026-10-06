import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";

export function buildPortfolioApprovedEmailHtml(params: {
  studioName: string;
  workTitle: string;
  creatorUrl: string;
  dashboardUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">作品可以公開了</h1>
  <p>嗨，<strong>${escapeHtml(params.studioName)}</strong> 的「${escapeHtml(params.workTitle)}」已經通過，會出現在你的公開頁上。</p>
  <p style="margin: 24px 0;">
    ${emailCta(params.creatorUrl, "去公開頁看看")}
  </p>
  <p><a href="${params.dashboardUrl}">回後台</a></p>
  ${emailAutoFooter()}
</body>
</html>`;
}

export function buildPortfolioRejectedEmailHtml(params: {
  studioName: string;
  workTitle: string;
  studioEditUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">這支作品這次先沒過</h1>
  <p>嗨，<strong>${escapeHtml(params.studioName)}</strong> 送審的「${escapeHtml(params.workTitle)}」這次還沒通過，所以暫時不會出現在公開頁。</p>
  <p>麻煩看一下連結能不能播放、風格跟工作室是否接近。調好之後，再到後台重新新增或調整就可以了。</p>
  <p style="margin: 24px 0;">
    ${emailCta(params.studioEditUrl, "去編輯工作室與作品")}
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}
