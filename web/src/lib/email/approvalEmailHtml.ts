interface ApprovalEmailParams {
  studioName: string;
  creatorUrl: string;
  dashboardUrl: string;
}

export function buildApprovalEmailHtml({
  studioName,
  creatorUrl,
  dashboardUrl,
}: ApprovalEmailParams): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">恭喜，你的工作室已審核通過</h1>
  <p>你好，</p>
  <p><strong>${escapeHtml(studioName)}</strong> 已通過 Vigo 審核並正式上架，發案者現在可以在平台上找到你。</p>
  <p style="margin: 24px 0;">
    <a href="${creatorUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">查看公開頁</a>
  </p>
  <p>建議你接下來：</p>
  <ul>
    <li>到後台完善工作室資料與作品</li>
    <li>確認價目表與聯絡方式</li>
    <li>分享你的公開頁給潛在發案者</li>
  </ul>
  <p>發案者需「敲門」後才會看到完整作品集與聯絡方式；你可以在後台查看被敲門次數。</p>
  <p style="margin-top: 24px;">
    <a href="${dashboardUrl}">前往創作者後台</a>
  </p>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">此信由 Vigo 系統自動發送，請勿直接回覆。</p>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
