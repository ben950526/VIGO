export const REFERRAL_CREDIT_PER_SIGNUP = 50;
export const REFERRAL_CREDIT_MAX_BALANCE = 1000;

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
