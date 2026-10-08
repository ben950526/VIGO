import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";
import {
  REFERRAL_CREDIT_MAX_BALANCE,
  REFERRAL_CREDIT_PER_SIGNUP,
  SOCIAL_SHARE_CREDIT,
} from "@/lib/referral/config";

export type OnboardingNudgeDay = 1 | 3 | 7;

export function onboardingNudgeSubject(day: OnboardingNudgeDay): string {
  if (day === 1) return "【Vigo】登入後再補一下工作室，發案者才找得到你";
  if (day === 3) return "【Vigo】再花幾分鐘補介紹和作品，會差很多";
  return "【Vigo】你的頁面還有點空，補上會比較容易被看見";
}

function intro(day: OnboardingNudgeDay, name: string): string {
  const who = `<p>嗨，<strong>${name}</strong>：</p>`;
  if (day === 1) {
    return `${who}<p>你昨天在 Vigo 建立了帳號。想跟你說一聲：註冊只是有登入帳號，補上介紹和作品，發案者逛探索頁時才知道可以找你。</p>`;
  }
  if (day === 3) {
    return `${who}<p>你前幾天加入 Vigo 了。若還沒補工作室，發案者進來多半會略過空白頁。不用一次做到完美，先寫你擅長什麼、再貼一支能點開的片子就好。</p>`;
  }
  return `${who}<p>距離你註冊已經一週了。若頁面還空著，探索頁也不會露出，有點可惜。有空補一下，對方才知道你在做什麼。</p>`;
}

export function buildOnboardingNudgeHtml(params: {
  day: OnboardingNudgeDay;
  studioName: string;
  missing: string[];
  studioEditUrl: string;
  dashboardUrl: string;
}): string {
  const name = escapeHtml(params.studioName);
  const items =
    params.missing.length > 0
      ? `<p>目前比較缺的是：</p><ul>${params.missing
          .map((m) => `<li>${escapeHtml(m)}</li>`)
          .join("")}</ul>`
      : "";

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  ${intro(params.day, name)}
  ${items}
  <p>補完之後：</p>
  <ul>
    <li>審核通過、又有已公開作品，就會出現在探索頁。</li>
    <li>發案者按「敲門」後，才看得到完整介紹和聯絡方式。</li>
    <li>邀請同行完成接案者註冊拿 ${REFERRAL_CREDIT_PER_SIGNUP} 點／人；公開貼文附連結送審通過拿 ${SOCIAL_SHARE_CREDIT} 點（每人一次）。點數不能換現，上限 ${REFERRAL_CREDIT_MAX_BALANCE} 點。</li>
  </ul>
  <p style="margin: 24px 0 8px;">
    ${emailCta(params.studioEditUrl, "去補工作室")}
    ${emailCta(params.dashboardUrl, "回後台")}
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}
