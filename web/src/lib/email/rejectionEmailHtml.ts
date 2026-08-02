import { escapeHtml } from "@/lib/email/escapeHtml";

interface RejectionEmailParams {
  studioName: string;
  profileUrl: string;
  dashboardUrl: string;
}

export function buildRejectionEmailHtml({
  studioName,
  profileUrl,
  dashboardUrl,
}: RejectionEmailParams): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">工作室審核未通過</h1>
  <p>你好，</p>
  <p>很抱歉，<strong>${escapeHtml(studioName)}</strong> 這次尚未通過 Vigo 審核，目前不會在平台上公開。</p>
  <p>常見原因包含：資料不完整、作品連結無法開啟、內容與平台定位不符等。請依下列步驟調整後重新送審：</p>
  <ul>
    <li>到後台完善工作室自介、服務與聯絡方式</li>
    <li>確認作品連結可正常播放</li>
    <li>儲存資料後會自動重新進入審核</li>
  </ul>
  <p style="margin: 24px 0;">
    <a href="${profileUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">編輯工作室資料</a>
  </p>
  <p style="margin-top: 24px;">
    <a href="${dashboardUrl}">前往創作者後台</a>
  </p>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">此信由 Vigo 系統自動發送，請勿直接回覆。</p>
</body>
</html>`;
}
