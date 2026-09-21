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
  <p>你是 Vigo 的接案創作者，這封信想跟你說：<strong>Vigo 經過約一個月的內部優化，現在重新上線，且近期將快速對外推廣</strong>，讓更多發案者來找創作者合作。</p>
  <p>若你當初<strong>只完成註冊</strong>，工作室或作品還沒填完整，請<strong>盡快</strong>補齊——推廣期間，完整的工作室頁與作品集才容易被看見、被敲門。</p>
  <p><strong>建議你現在就做：</strong></p>
  <ul>
    <li><a href="${base}/dashboard/studio">編輯工作室內容</a>（介紹、服務、聯絡方式）</li>
    <li>新增至少 1 支作品連結並送審</li>
    <li><a href="${base}/dashboard">登入儀表板</a>複製專屬邀請碼（折抵點不可換現，訂閱上線後依公告折抵）</li>
    <li><a href="${base}/explore">到探索頁</a>看看公開呈現</li>
  </ul>
  <p>問題或建議：<a href="${base}/feedback">意見回饋</a></p>
  <p style="margin-top: 2rem; font-size: 12px; color: #666;">
    你會收到這封信，是因為曾在 Vigo 註冊接案者帳號。若不想再收到平台公告，請透過意見回饋告知我們。
  </p>
  <p>— Vigo 團隊</p>
</body>
</html>`;
}
