import type { MilestoneReport } from "@/lib/milestones/runWeeklyMilestoneCheck";
import {
  ACTIVE_CREATOR_TARGET,
  CONSECUTIVE_WEEKS,
  KNOCK_WEEKLY_TARGET,
  STOP_LOSS_DATE,
} from "@/lib/milestones/runWeeklyMilestoneCheck";

export function weeklyMilestoneSubject(report: MilestoneReport): string {
  if (report.monetizeReady) return "【Vigo 週報】🟢 收費門檻達成，可以開始做金流了";
  if (report.daysToStopLoss <= 0) return "【Vigo 週報】🔴 停損檢查日到了，請看 Google 搜尋人數";
  if (report.daysToStopLoss <= 30) {
    return `【Vigo 週報】停損檢查日剩 ${report.daysToStopLoss} 天`;
  }
  return "【Vigo 週報】收費門檻與停損進度";
}

export function buildWeeklyMilestoneHtml(params: {
  report: MilestoneReport;
  adminUrl: string;
}): string {
  const { report, adminUrl } = params;
  const weekRows = report.weeks
    .map((week) => {
      const pass = week.knocks >= KNOCK_WEEKLY_TARGET;
      return `<tr><td style="padding:4px 12px 4px 0">${week.weekStart} 那週</td><td style="padding:4px 0;font-weight:600;color:${pass ? "#15803d" : "#b91c1c"}">${week.knocks} 次${pass ? " ✓" : ""}</td></tr>`;
    })
    .join("");
  const passWeeks = report.weeks.filter((w) => w.knocks >= KNOCK_WEEKLY_TARGET).length;
  const activePass = report.activeCreators >= ACTIVE_CREATOR_TARGET;

  const verdict = report.monetizeReady
    ? `<p style="padding:12px 16px;border-radius:12px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534"><strong>🟢 兩個條件都達成了。</strong>可以開始做綠界／Pro 收費。回到 Claude 說「開始做金流」，並先去綠界申請商店帳號（要用你本人資料，我不能代辦）。</p>`
    : `<p style="padding:12px 16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155">還沒達標，<strong>先不要收費</strong>。敲門有 ${passWeeks}／${CONSECUTIVE_WEEKS} 週達標，活躍接案者${activePass ? "已達標" : "還不夠"}。</p>`;

  let stopLoss: string;
  if (report.daysToStopLoss <= 0) {
    stopLoss = `<p style="padding:12px 16px;border-radius:12px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b"><strong>🔴 停損檢查日（${STOP_LOSS_DATE}）到了。</strong>請打開 Google Search Console 看最近一個月「點擊」：仍 &lt; 100 就照原計畫停止開發、網站維持現狀；≥ 100 就繼續。</p>`;
  } else {
    stopLoss = `<p style="color:#334155">停損檢查日 ${STOP_LOSS_DATE}，還有 <strong>${report.daysToStopLoss} 天</strong>。到時候每月 Google 搜尋進站仍 &lt; 100 人就停止開發。${report.daysToStopLoss <= 30 ? "建議這幾週先去 Search Console 看一下趨勢。" : ""}</p>`;
  }

  return `<!doctype html><html><body style="margin:0;padding:24px;font-family:-apple-system,'PingFang TC','Noto Sans TC',sans-serif;font-size:15px;line-height:1.6;color:#0f172a">
<h2 style="margin:0 0 12px">Vigo 每週門檻檢查</h2>
${verdict}
<h3 style="margin:20px 0 6px;font-size:16px">① 發案者敲門（不含管理員，每週要 ≥ ${KNOCK_WEEKLY_TARGET}，連續 ${CONSECUTIVE_WEEKS} 週）</h3>
<table style="border-collapse:collapse">${weekRows}</table>
<h3 style="margin:20px 0 6px;font-size:16px">② 活躍接案者（要 ≥ ${ACTIVE_CREATOR_TARGET}）</h3>
<p style="margin:0;color:${activePass ? "#15803d" : "#b91c1c"};font-weight:600">${report.activeCreators} 間</p>
<p style="margin:4px 0 0;color:#64748b;font-size:13px">探索頁看得到的 ${report.visibleCreators} 間裡，30 天內有登入、改過工作室或新增作品的。</p>
<h3 style="margin:20px 0 6px;font-size:16px">③ 停損</h3>
${stopLoss}
<p style="margin-top:24px"><a href="${adminUrl}" style="color:#4f46e5">打開管理後台</a></p>
<p style="color:#94a3b8;font-size:12px">這封信每週一早上自動寄出，只讀資料、不會改任何東西。</p>
</body></html>`;
}
