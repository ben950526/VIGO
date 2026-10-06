import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";

export function buildPromoShareApprovedEmailHtml(params: {
  studioName: string;
  creditsAwarded: number;
  postUrl: string;
  dashboardUrl: string;
}): string {
  const creditLine =
    params.creditsAwarded > 0
      ? `折抵點已幫你加上 <strong>${params.creditsAwarded} 點</strong>。`
      : `這次是 0 點（多半是已經滿額，或餘額到上限了）。謝謝你還是幫我們發了文。`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">宣傳貼文通過了，謝謝你</h1>
  <p>嗨，<strong>${escapeHtml(params.studioName)}</strong> 送審的公開貼文已經通過。</p>
  <p>${creditLine}</p>
  <p>貼文：<a href="${escapeHtml(params.postUrl)}">${escapeHtml(params.postUrl)}</a></p>
  <p style="margin: 24px 0;">
    ${emailCta(params.dashboardUrl, "去後台看折抵點")}
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}

export function buildPromoShareRejectedEmailHtml(params: {
  studioName: string;
  postUrl: string;
  adminNote: string | null;
  dashboardUrl: string;
}): string {
  const note = params.adminNote?.trim()
    ? `<p>補充說明：${escapeHtml(params.adminNote.trim())}</p>`
    : `<p>常見是：貼文不是公開的、沒附邀請連結或邀請碼，或內容跟 Vigo 比較對不上。</p>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">宣傳貼文這次還沒過</h1>
  <p>嗨，<strong>${escapeHtml(params.studioName)}</strong> 送審的貼文這次先沒通過，所以還沒發折抵點。調一下再送就可以。</p>
  ${note}
  <p>貼文：<a href="${escapeHtml(params.postUrl)}">${escapeHtml(params.postUrl)}</a></p>
  <p>每人終身只能通過一次；這次沒過的話，調整後還可以再送審。</p>
  <p style="margin: 24px 0;">
    ${emailCta(params.dashboardUrl, "回後台")}
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}
