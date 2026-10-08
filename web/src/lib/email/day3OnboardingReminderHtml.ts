import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";
import {
  REFERRAL_CREDIT_MAX_BALANCE,
  REFERRAL_CREDIT_PER_SIGNUP,
  SOCIAL_SHARE_CREDIT,
} from "@/lib/referral/config";

export const DAY3_ONBOARDING_SUBJECT = "【Vigo】註冊後再花幾分鐘，發案者才找得到你";

export function buildDay3OnboardingReminderHtml(params: {
  studioName: string;
  missing: string[];
  studioEditUrl: string;
  dashboardUrl: string;
}): string {
  const items =
    params.missing.length > 0
      ? `<p>目前比較缺的是：</p><ul>${params.missing
          .map((m) => `<li>${escapeHtml(m)}</li>`)
          .join("")}</ul>`
      : `<p>工作室資料看起來差不多了，若作品還沒掛上，補一支能點開的 YouTube／Reels 就差很多。</p>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>嗨，<strong>${escapeHtml(params.studioName)}</strong>：</p>
  <p>你前幾天在 Vigo 建立了帳號。想再跟你說一聲：註冊只是第一步，補上介紹和作品，發案者逛探索頁時才知道可以找你。</p>
  ${items}
  <p>做完之後：</p>
  <ul>
    <li>審核通過、又有已公開作品，就會出現在探索頁。</li>
    <li>發案者按「敲門」後，才看得到完整介紹和聯絡方式。</li>
    <li>你也有專屬邀請碼：好友完成接案者註冊拿 ${REFERRAL_CREDIT_PER_SIGNUP} 點／人；公開貼文附連結送審通過拿 ${SOCIAL_SHARE_CREDIT} 點（每人一次）。點數不能換現，上限 ${REFERRAL_CREDIT_MAX_BALANCE} 點，之後若有訂閱可依公告折抵。</li>
  </ul>
  <p>不用一次做到完美。先寫一小段你擅長什麼，再貼一支作品，就已經夠對方看了。</p>
  <p style="margin: 24px 0 8px;">
    ${emailCta(params.studioEditUrl, "去補工作室")}
    ${emailCta(params.dashboardUrl, "回後台")}
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}
