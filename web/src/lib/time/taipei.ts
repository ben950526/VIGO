const TAIPEI_OFFSET = "+08:00";

/** 台北時區的 YYYY-MM-DD */
export function taipeiDateString(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

/** 該台北日期的 00:00（ISO 對應 UTC 瞬間） */
export function startOfTaipeiDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00${TAIPEI_OFFSET}`);
}

/** 昨日 00:00～今日 00:00（台北），供每日摘要查詢 */
export function getYesterdayRangeInTaipei(now = new Date()): { start: Date; end: Date } {
  const todayStr = taipeiDateString(now);
  const todayStart = startOfTaipeiDay(todayStr);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  return { start: yesterdayStart, end: todayStart };
}

export function formatTaipeiDateTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
