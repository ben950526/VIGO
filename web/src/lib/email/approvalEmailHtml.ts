import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";
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
  /** 與探索頁同一套門檻；空陣列代表現在就會出現 */
  exploreGaps?: string[];
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
  exploreGaps = [],
}: ApprovalEmailParams): string {
  const name = escapeHtml(studioName);
  const codeBlock = inviteCode
    ? `<p style="margin: 12px 0; padding: 12px 16px; background: #f1f5f9; border-radius: 8px; font-size: 18px; letter-spacing: 0.08em;"><strong>${escapeHtml(inviteCode)}</strong></p>
       ${referralUrl ? `<p>你的邀請連結：<a href="${referralUrl}">${escapeHtml(referralUrl)}</a></p>` : ""}`
    : `<p>登入後台就可以複製你的邀請碼和連結。</p>`;

  const gapList = exploreGaps.map((gap) => `<li>${escapeHtml(gap)}</li>`).join("");
  const listingBlock =
    exploreGaps.length === 0
      ? `<p>嗨，好消息：<strong>${name}</strong> 已經通過審核，現在會出現在探索頁。</p>
  <p>發案者會先逛作品；對到風格才按「敲門」看聯絡方式。</p>
  <p style="margin: 24px 0 8px;">${emailCta(creatorUrl, "先看自己的公開頁")}</p>`
      : `<p>嗨，好消息：<strong>${name}</strong> 已經通過審核。帳號沒問題，但探索頁目前還看不到你，因為還差：</p>
  <ul>${gapList}</ul>
  <p>補上之後會<strong>自動出現</strong>，不用再送審一次。</p>
  <p style="margin: 24px 0 8px;">
    ${emailCta(studioEditUrl, "去補介紹")}
    ${emailCta(portfolioUrl, "去新增作品")}
  </p>`;

  const extraTips =
    exploreGaps.length === 0
      ? `<h2 style="font-size: 17px; margin-top: 28px;">想再被敲門的話</h2>
  <p>介紹寫清楚一點、作品可以再多掛幾支，對方比較知道適不適合找你。這些是加分，不是上探索頁的條件。</p>`
      : `<h2 style="font-size: 17px; margin-top: 28px;">上探索頁只要這兩件事</h2>
  <p>介紹大約 20 字，加上至少 1 支已通過的 YouTube 或 Reels。地區、價目表之後再補也沒關係。</p>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="utf-8" /></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">恭喜，工作室已通過審核</h1>
  ${listingBlock}
  ${extraTips}
  <p style="margin: 24px 0 8px;">
    ${emailCta(studioEditUrl, "編輯工作室")}
    ${emailCta(portfolioUrl, "新增作品")}
  </p>

  <h2 style="font-size: 17px; margin-top: 28px;">頁面齊了之後，可以用宣傳累積折抵點</h2>
  <p>點數不能換現金、也不能轉給別人。之後若有付費訂閱，可依當時公告折抵月費。現在先慢慢累、上限 <strong>${REFERRAL_CREDIT_MAX_BALANCE} 點</strong>。</p>
  <ul>
    <li>朋友用你的邀請碼或連結完成<strong>接案者註冊</strong>：你拿 <strong>${REFERRAL_CREDIT_PER_SIGNUP} 點／人</strong>。</li>
    <li>在 Threads、Facebook 等發<strong>公開貼文</strong>介紹 Vigo，文裡附邀請連結或邀請碼，到後台送審通過：<strong>${SOCIAL_SHARE_CREDIT} 點，每人終身一次</strong>。</li>
  </ul>
  <p>如果探索頁還看不到你就先發文，點進來的人會不知道你在做什麼。建議<strong>先補齊再貼</strong>。</p>
  ${codeBlock}
  <p style="margin: 16px 0 8px;">${emailCta(dashboardUrl, "到後台複製邀請碼／送審貼文")}</p>

  <p style="margin-top: 28px; font-size: 14px; color: #475569;">
    細節寫在 <a href="${termsUrl}">使用條款 · 推廣折抵點</a>。
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}
