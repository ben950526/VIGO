import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";

export const EXPLORE_LISTING_NOTICE_SUBJECT =
  "【Vigo】想跟你說一聲：探索頁之後會先露出有介紹和作品的工作室";

export function buildExploreListingNoticeHtml(params: {
  studioName: string;
  alreadyVisible: boolean;
  studioEditUrl: string;
  dashboardUrl: string;
}): string {
  const name = escapeHtml(params.studioName);
  const extra = params.alreadyVisible
    ? `<p>你的工作室介紹和作品已經齊了，這次調整<strong>不會影響</strong>你出現在探索頁。只是跟大家同步一下，免得之後有人以為帳號出了問題。</p>`
    : `<p>你的帳號都還在，也沒有被停用。只是如果介紹還比較短、或還沒有已通過的作品，暫時不會出現在探索頁。補上之後就會自動出現，<strong>不用再送審一次</strong>。</p>
  <p>真的不用一次做到完美。一小段「你擅長什麼、適合誰」，再加上至少一支能點開的 YouTube 或 Reels，就夠了。</p>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>嗨，<strong>${name}</strong>：</p>
  <p>先跟你說一聲，沒有責備的意思，也不是要趕人。</p>
  <p>發案者進來逛的時候，如果很多頁面還沒有介紹或作品，其實不太知道能找誰。為了讓真正有在接案的人比較容易被看見，我們把探索頁調成：</p>
  <ul>
    <li>有一小段工作室介紹</li>
    <li>至少有 1 支已通過審核的作品</li>
  </ul>
  <p>符合的才會出現在探索頁和首頁精選。公開連結也一樣。</p>
  ${extra}
  <p style="margin: 24px 0 8px;">
    ${emailCta(params.studioEditUrl, "去看看工作室")}
    ${emailCta(params.dashboardUrl, "回後台")}
  </p>
  <p>有任何不方便的地方，到網站的「意見回饋」跟我們說就好，我們會看。</p>
  ${emailAutoFooter()}
</body>
</html>`;
}
