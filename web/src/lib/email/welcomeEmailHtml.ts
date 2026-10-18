import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";
import {
  REFERRAL_CREDIT_MAX_BALANCE,
  REFERRAL_CREDIT_PER_SIGNUP,
  SOCIAL_SHARE_CREDIT,
} from "@/lib/referral/config";

export function welcomeEmailSubject(): string {
  return "【Vigo】帳號已建立，接下來補工作室和作品";
}

export function buildWelcomeEmailHtml(params: {
  studioName: string;
  studioEditUrl: string;
  dashboardUrl: string;
  loginUrl: string;
}): string {
  const name = escapeHtml(params.studioName);

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>嗨，<strong>${name}</strong>：</p>
  <p>你的 Vigo 帳號已經建立完成。註冊只是有登入帳號；補上介紹和作品，發案者逛探索頁時才知道可以找你。</p>
  <p>接下來請做這兩件事：</p>
  <ol>
    <li>填工作室：介紹、地區、服務、風格、聯絡方式。</li>
    <li>貼至少 1 支 YouTube 或 Reels。審核通過，且介紹約 20 字，才會出現在探索頁。</li>
  </ol>
  <p>補完之後：</p>
  <ul>
    <li>發案者可先看作品；按「敲門」後才看得到聯絡方式。</li>
    <li>邀請同行完成接案者註冊拿 ${REFERRAL_CREDIT_PER_SIGNUP} 點／人；公開貼文附連結送審通過拿 ${SOCIAL_SHARE_CREDIT} 點（每人一次）。點數不能換現，上限 ${REFERRAL_CREDIT_MAX_BALANCE} 點。</li>
  </ul>
  <p style="margin: 24px 0 8px;">
    ${emailCta(params.loginUrl, "去登入")}
    ${emailCta(params.studioEditUrl, "去補工作室")}
    ${emailCta(params.dashboardUrl, "回後台")}
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}
