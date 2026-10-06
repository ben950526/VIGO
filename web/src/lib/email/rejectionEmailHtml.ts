import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";

interface RejectionEmailParams {
  studioName: string;
  profileUrl: string;
  dashboardUrl: string;
}

export function buildRejectionEmailHtml({
  studioName,
  profileUrl,
  dashboardUrl,
}: RejectionEmailParams): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">這次還沒過，調整後可以再送</h1>
  <p>嗨，</p>
  <p>先跟你說一聲：<strong>${escapeHtml(studioName)}</strong> 這次還沒通過，所以暫時不會出現在探索頁。不是拒絕往來，補一補再存檔，就會重新進入審核。</p>
  <p>常見是這幾種情況，你可以對一下：</p>
  <ul>
    <li>介紹、服務或聯絡方式還不完整</li>
    <li>作品連結打不開、或還沒掛作品</li>
    <li>內容跟短影音接案比較對不太上</li>
  </ul>
  <p style="margin: 24px 0;">
    ${emailCta(profileUrl, "回去編輯工作室")}
  </p>
  <p><a href="${dashboardUrl}">回創作者後台</a></p>
  ${emailAutoFooter()}
</body>
</html>`;
}
