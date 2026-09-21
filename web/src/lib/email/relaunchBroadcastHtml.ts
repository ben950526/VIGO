import { escapeHtml } from "@/lib/email/escapeHtml";

export const RELAUNCH_BROADCAST_SUBJECT =
  "【Vigo】沉潛一個月，我們回來了——邀請你回來看看工作室";

export function buildRelaunchBroadcastHtml(params: {
  siteUrl: string;
  studioName?: string | null;
}): string {
  const base = params.siteUrl.replace(/\/$/, "");
  const greeting = params.studioName?.trim()
    ? `Hi，${escapeHtml(params.studioName.trim())}：`
    : "Hi，";

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px;">
  <p>${greeting}</p>
  <p>你是 Vigo 的接案創作者，這封信想跟你說：<strong>Vigo 經過約一個月的內部優化，現在重新上線服務。</strong></p>
  <p>這段時間我們調整了登入註冊、工作室編輯、公開頁預覽與審核流程，也上了<strong>推廣累點</strong>——登入後在儀表板可複製你的<strong>專屬邀請碼</strong>（折抵點不可換現，訂閱方案上線後依公告折抵）。</p>
  <p><strong>你可以現在就做：</strong></p>
  <ul>
    <li><a href="${base}/dashboard">登入我的工作室</a></li>
    <li><a href="${base}/explore">到探索頁看看呈現方式</a></li>
    <li>若有新作品或資料，到「編輯工作室內容」更新並送審</li>
  </ul>
  <p>問題或建議：<a href="${base}/feedback">意見回饋</a></p>
  <p style="margin-top: 2rem; font-size: 12px; color: #666;">
    你會收到這封信，是因為曾在 Vigo 註冊接案者帳號。若不想再收到平台公告，請透過意見回饋告知我們。
  </p>
  <p>— Vigo 團隊</p>
</body>
</html>`;
}
