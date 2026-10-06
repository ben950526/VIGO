import { escapeHtml } from "@/lib/email/escapeHtml";

export const RELAUNCH_BROADCAST_SUBJECT = "【Vigo】回來了，想請你把工作室再看一眼";

export function buildRelaunchBroadcastHtml(params: {
  siteUrl: string;
  studioName?: string | null;
}): string {
  const base = params.siteUrl.replace(/\/$/, "");
  const greeting = params.studioName?.trim()
    ? `嗨，${escapeHtml(params.studioName.trim())}：`
    : "嗨，";

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px;">
  <p>${greeting}</p>
  <p>你是 Vigo 的接案創作者。我們內部調整了大約一個月，現在重新上線，接下來也會比較積極讓發案者進來逛。</p>
  <p>如果當初只註冊、工作室或作品還沒填完，有空補一下會差很多——頁面完整，才比較容易被看見、被敲門。</p>
  <p>方便的話可以先做這幾件：</p>
  <ul>
    <li><a href="${base}/dashboard/studio">編輯工作室</a>（介紹、服務、聯絡方式）</li>
    <li>新增至少 1 支作品連結並送審</li>
    <li><a href="${base}/dashboard">登入後台</a>複製你的邀請碼（折抵點不能換現，訂閱上線後依公告折抵）</li>
    <li><a href="${base}/explore">到探索頁</a>看看別人怎麼呈現</li>
  </ul>
  <p>有話想說：<a href="${base}/feedback">意見回饋</a></p>
  <p style="margin-top: 2rem; font-size: 12px; color: #666;">
    會寄這封，是因為你曾在 Vigo 註冊接案者帳號。如果不想再收到平台公告，跟我們說一聲就好。
  </p>
  <p>謝謝，<br />Vigo</p>
</body>
</html>`;
}
