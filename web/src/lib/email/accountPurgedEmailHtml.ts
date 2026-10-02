import { escapeHtml } from "@/lib/email/escapeHtml";

interface PurgeEmailParams {
  studioName: string;
  reason: string | null;
  registerUrl: string;
  feedbackUrl: string;
}

export function buildAccountPurgedEmailHtml({
  studioName,
  reason,
  registerUrl,
  feedbackUrl,
}: PurgeEmailParams): string {
  const reasonBlock = reason
    ? `<p><strong>說明：</strong>${escapeHtml(reason)}</p>`
    : `<p><strong>說明：</strong>平台已將此工作室與登入帳號完整註銷，相關資料不會保留。</p>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="utf-8" /></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">你的 Vigo 帳號已註銷</h1>
  <p>你好，工作室「<strong>${escapeHtml(studioName)}</strong>」的登入帳號已被註銷，目前無法再登入。</p>
  ${reasonBlock}
  <p>一併移除的內容包含：工作室頁、作品、敲門紀錄、邀請碼與該帳號的推廣折抵點。這些資料<strong>無法復原</strong>。</p>

  <h2 style="font-size: 17px; margin-top: 28px;">你可以這樣做</h2>
  <ol>
    <li>若仍想使用 Vigo：用<strong>同一個 Email 重新註冊</strong>即可（舊資料不會回來，需重新填工作室與作品）。</li>
    <li>註冊後請補齊介紹與作品並送審，通過後才會出現在探索頁。</li>
    <li>若這不是你本人操作、或你認為註銷有誤：請透過意見回饋告訴我們（請註明工作室名稱與註冊 Email）。請理解我們無法把已刪除的帳號救回，但可以協助你重新加入。</li>
  </ol>
  <p style="margin: 24px 0 8px;">
    <a href="${registerUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; margin: 0 8px 8px 0;">重新註冊</a>
    <a href="${feedbackUrl}" style="display: inline-block; background: #fff; color: #0f172a; padding: 12px 20px; border-radius: 8px; text-decoration: none; border: 1px solid #0f172a; margin: 0 8px 8px 0;">意見回饋</a>
  </p>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">此信由 Vigo 系統自動發送，請勿直接回覆。</p>
</body>
</html>`;
}
