import { escapeHtml } from "@/lib/email/escapeHtml";

export function buildPromoShareApprovedEmailHtml(params: {
  studioName: string;
  creditsAwarded: number;
  postUrl: string;
  dashboardUrl: string;
}): string {
  const creditLine =
    params.creditsAwarded > 0
      ? `已發放 <strong>${params.creditsAwarded} 點</strong> 折抵點。`
      : `這次發放 0 點（可能已達上限，或餘額已滿）。`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">社群宣傳已審核通過</h1>
  <p>你好，<strong>${escapeHtml(params.studioName)}</strong> 送審的公開貼文已通過。</p>
  <p>${creditLine}</p>
  <p>貼文連結：<a href="${escapeHtml(params.postUrl)}">${escapeHtml(params.postUrl)}</a></p>
  <p style="margin: 24px 0;">
    <a href="${params.dashboardUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">查看折抵點</a>
  </p>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">此信由 Vigo 系統自動發送，請勿直接回覆。</p>
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
    ? `<p>管理員備註：${escapeHtml(params.adminNote.trim())}</p>`
    : `<p>常見原因：貼文未公開、沒有附上邀請連結或邀請碼、內容與 Vigo 無關。</p>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">社群宣傳未通過</h1>
  <p>你好，<strong>${escapeHtml(params.studioName)}</strong> 送審的公開貼文這次尚未通過，未發放折抵點。</p>
  ${note}
  <p>貼文連結：<a href="${escapeHtml(params.postUrl)}">${escapeHtml(params.postUrl)}</a></p>
  <p>調整後可再到儀表板重新送審（每人終身僅能通過一次）。</p>
  <p style="margin: 24px 0;">
    <a href="${params.dashboardUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">前往儀表板</a>
  </p>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">此信由 Vigo 系統自動發送，請勿直接回覆。</p>
</body>
</html>`;
}
