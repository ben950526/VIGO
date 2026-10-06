import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";

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
    ? `<p>這次註銷的說明：${escapeHtml(reason)}</p>`
    : `<p>這個工作室的登入帳號已經從平台拿掉，相關資料不會再保留。</p>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="utf-8" /></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">帳號已註銷</h1>
  <p>嗨，跟你說一聲：工作室「<strong>${escapeHtml(studioName)}</strong>」的登入帳號已經註銷，現在沒辦法再用這個帳號登入。</p>
  ${reasonBlock}
  <p>一起拿掉的包含工作室頁、作品、敲門紀錄、邀請碼，以及這個帳號的折抵點。這些<strong>沒辦法救回來</strong>，先跟你講清楚。</p>

  <h2 style="font-size: 17px; margin-top: 28px;">接下來可以怎麼做</h2>
  <ol>
    <li>還想用 Vigo 的話，用<strong>同一個 Email 重新註冊</strong>就可以（舊資料不會回來，工作室和作品要再填一次）。</li>
    <li>註冊後再補介紹和作品並送審，通過後才會出現在探索頁。</li>
    <li>如果這不是你本人操作，或覺得有誤會：請到意見回饋告訴我們（註明工作室名稱和註冊 Email）。已刪除的帳號沒辦法還原，但我們可以幫你重新加入。</li>
  </ol>
  <p style="margin: 24px 0 8px;">
    ${emailCta(registerUrl, "重新註冊")}
    <a href="${feedbackUrl}" style="display: inline-block; background: #fff; color: #0f172a; padding: 12px 20px; border-radius: 8px; text-decoration: none; border: 1px solid #0f172a; margin: 0 8px 8px 0;">意見回饋</a>
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}
