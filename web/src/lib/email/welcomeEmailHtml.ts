import { escapeHtml } from "@/lib/email/escapeHtml";
import {
  REFERRAL_CREDIT_MAX_BALANCE,
  REFERRAL_CREDIT_PER_SIGNUP,
  SOCIAL_SHARE_CREDIT,
} from "@/lib/referral/config";

export const WELCOME_EMAIL_SUBJECT = "【Vigo】註冊成功——先把工作室補齊，再拿推廣點";

interface WelcomeEmailParams {
  studioName: string;
  inviteCode: string | null;
  referralUrl: string | null;
  studioEditUrl: string;
  portfolioUrl: string;
  dashboardUrl: string;
  termsUrl: string;
}

function cta(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; margin: 0 8px 8px 0;">${escapeHtml(label)}</a>`;
}

export function buildWelcomeEmailHtml({
  studioName,
  inviteCode,
  referralUrl,
  studioEditUrl,
  portfolioUrl,
  dashboardUrl,
  termsUrl,
}: WelcomeEmailParams): string {
  const name = escapeHtml(studioName);
  const codeBlock = inviteCode
    ? `<p style="margin: 12px 0; padding: 12px 16px; background: #f1f5f9; border-radius: 8px; font-size: 18px; letter-spacing: 0.08em;"><strong>${escapeHtml(inviteCode)}</strong></p>
       ${referralUrl ? `<p>邀請連結：<a href="${referralUrl}">${escapeHtml(referralUrl)}</a></p>` : ""}`
    : `<p>登入儀表板即可複製你的專屬邀請碼與連結。</p>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="utf-8" /></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">歡迎加入 Vigo</h1>
  <p>你好，<strong>${name}</strong> 已經註冊完成。</p>
  <p>不過現在發案者<strong>還看不到你</strong>。探索頁只會出現「審核通過、且有作品」的工作室——帳號本身不夠，作品集才是被敲門的理由。</p>

  <h2 style="font-size: 17px; margin-top: 28px;">先做這三步（大約 15 分鐘）</h2>
  <ol>
    <li>把工作室介紹、服務項目、地區、聯絡方式寫清楚。</li>
    <li>新增至少 <strong>3 支</strong> YouTube／Reels 作品並送審（先 3 支就好，不必一次完美）。</li>
    <li>等通過後，你的頁面才會出現在探索頁，發案者才能敲門看完整內容。</li>
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
  <p>空的工作室拿去宣傳，發案者點進去會沒東西可看。所以請<strong>先補作品再發文</strong>——你的邀請才有說服力，點數也才值得。</p>
  ${codeBlock}
  <p style="margin: 16px 0 8px;">${cta(dashboardUrl, "到儀表板複製邀請碼／送審貼文")}</p>

  <p style="margin-top: 28px; font-size: 14px; color: #475569;">
    規則細節見 <a href="${termsUrl}">使用條款 · 推廣折抵點</a>。此信由系統自動發送，請勿直接回覆。
  </p>
</body>
</html>`;
}
