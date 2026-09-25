export const REFERRAL_CREDIT_PER_SIGNUP = 20;
export const REFERRAL_CREDIT_MAX_BALANCE = 300;
export const SOCIAL_SHARE_CREDIT = 100;
/** 每人終身僅能通過審核領取一次社群宣傳獎勵 */
export const SOCIAL_SHARE_MAX_APPROVED = 1;

export const REFERRAL_TERMS_SUMMARY =
  "折抵點不可兌換現金、不可轉讓；僅能於本平台正式推出付費訂閱方案後，依當時公告規則折抵訂閱費用。";

export function buildReferralRegisterUrl(siteOrigin: string, inviteCode: string): string {
  const base = siteOrigin.replace(/\/$/, "");
  return `${base}/register?ref=${encodeURIComponent(inviteCode)}`;
}

/** 017 未跑完前可能沒有 invite_code，暫以 slug 當連結參數 */
export function resolvePublicInviteCode(profile: { invite_code: string; slug: string }): string {
  const code = profile.invite_code?.trim();
  return code || profile.slug;
}

export function buildSocialShareCopyText(params: {
  referralUrl: string;
  inviteCode: string;
}): string {
  return `我在用 Vigo 接短影音案：把工作室和 Reels／YouTube 作品收成一頁，發案的人可以先逛、比風格，合適再敲門聯絡，不用一直限動喊「有案請私」。

接案者免費註冊（我的邀請連結）：
${params.referralUrl}

（邀請碼：${params.inviteCode}）

請在貼文裡加上上面連結或邀請碼，並用 1～2 句話寫你自己的感受，不要只貼官方句。`;
}
