import { escapeHtml } from "@/lib/email/escapeHtml";
import {
  REFERRAL_CREDIT_MAX_BALANCE,
  REFERRAL_CREDIT_PER_SIGNUP,
  SOCIAL_SHARE_CREDIT,
} from "@/lib/referral/config";

interface ApprovalEmailParams {
  studioName: string;
  creatorUrl: string;
  dashboardUrl: string;
  studioEditUrl: string;
  portfolioUrl: string;
  termsUrl: string;
  inviteCode: string | null;
  referralUrl: string | null;
}

function cta(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; margin: 0 8px 8px 0;">${escapeHtml(label)}</a>`;
}

export function buildApprovalEmailHtml({
  studioName,
  creatorUrl,
  dashboardUrl,
  studioEditUrl,
  portfolioUrl,
  termsUrl,
  inviteCode,
  referralUrl,
}: ApprovalEmailParams): string {
  const name = escapeHtml(studioName);
  const codeBlock = inviteCode
    ? `<p style="margin: 12px 0; padding: 12px 16px; background: #f1f5f9; border-radius: 8px; font-size: 18px; letter-spacing: 0.08em;"><strong>${escapeHtml(inviteCode)}</strong></p>
       ${referralUrl ? `<p>邀請連結：<a href="${referralUrl}">${escapeHtml(referralUrl)}</a></p>` : ""}`
    : `<p>登入儀表板即可複製你的專屬邀請碼與連結。</p>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="utf-8" /></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">恭喜，你的工作室已審核通過</h1>
  <p>你好，<strong>${name}</strong> 已通過審核並上架。發案者可以在探索頁找到你；他們需先「敲門」，才會看到完整作品與聯絡方式。</p>
  <p style="margin: 24px 0 8px;">${cta(creatorUrl, "查看公開頁")}</p>

  <h2 style="font-size: 17px; margin-top: 28px;">先把工作室補齊（約 15 分鐘）</h2>
  <p>作品不夠或介紹空白，發案者敲門後也留不住。請盡快：</p>
  <ol>
    <li>把工作室介紹、服務項目、地區、聯絡方式寫清楚。</li>
    <li>至少上架 <strong>3 支</strong> YouTube／Reels 作品（先 3 支就好）。</li>
    <li>確認價目表，之後才適合對外宣傳。</li>
  </ol>
  <p style="margin: 24px 0 8px;">
    ${cta(studioEditUrl, "編輯工作室")}
    ${cta(portfolioUrl, "新增作品")}
  </p>

  <h2 style="font-size: 17px; margin-top: 28px;">補齊之後：用宣傳換折抵點</h2>
  <p>點數<strong>不能換現金、不能轉讓</strong>，之後正式推出付費訂閱時，可依公告折抵月費。現在先累積，上限 <strong>${REFERRAL_CREDIT_MAX_BALANCE} 點</strong>。</p>
  <ul>
    <li>好友用你的邀請碼或連結完成<strong>接案者註冊</strong>：你拿 <strong>${REFERRAL_CREDIT_PER_SIGNUP} 點／人</strong>。</li>
    <li>在 Threads、Facebook 等發<strong>公開貼文</strong>宣傳 Vigo，附上邀請連結或邀請碼，到儀表板送審通過：<strong>${SOCIAL_SHARE_CREDIT} 點，每人終身一次</strong>。</li>
  </ul>
  <p>空的工作室拿去宣傳，發案者點進去會沒東西可看。請<strong>先補作品再發文</strong>。</p>
  ${codeBlock}
  <p style="margin: 16px 0 8px;">${cta(dashboardUrl, "到儀表板複製邀請碼／送審貼文")}</p>

  <p style="margin-top: 28px; font-size: 14px; color: #475569;">
    規則細節見 <a href="${termsUrl}">使用條款 · 推廣折抵點</a>。此信由系統自動發送，請勿直接回覆。
  </p>
</body>
</html>`;
}
