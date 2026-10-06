import { escapeHtml } from "@/lib/email/escapeHtml";

export function buildPortfolioApprovedEmailHtml(params: {
  studioName: string;
  workTitle: string;
  creatorUrl: string;
  dashboardUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">作品已審核通過</h1>
  <p>你好，<strong>${escapeHtml(params.studioName)}</strong> 的作品「${escapeHtml(params.workTitle)}」已通過審核並公開。</p>
  <p style="margin: 24px 0;">
    <a href="${params.creatorUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">查看公開頁</a>
  </p>
  <p><a href="${params.dashboardUrl}">前往創作者後台</a></p>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">此信由 Vigo 系統自動發送，請勿直接回覆。</p>
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
  <h1 style="font-size: 22px; margin-bottom: 16px;">作品審核未通過</h1>
  <p>你好，<strong>${escapeHtml(params.studioName)}</strong> 的作品「${escapeHtml(params.workTitle)}」這次尚未通過審核，目前不會出現在公開頁。</p>
  <p>請確認連結可播放、內容與工作室定位相符後，再到後台重新新增或調整。</p>
  <p style="margin: 24px 0;">
    <a href="${params.studioEditUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">編輯工作室與作品</a>
  </p>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">此信由 Vigo 系統自動發送，請勿直接回覆。</p>
</body>
</html>`;
}
