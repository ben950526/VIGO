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

/** 台北週一 00:00（週一為一週之始） */
export function startOfTaipeiWeek(now = new Date()): Date {
  const todayStart = startOfTaipeiDay(taipeiDateString(now));
  const short = now.toLocaleDateString("en-US", {
    timeZone: "Asia/Taipei",
    weekday: "short",
  });
  const mondayOffset: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const daysFromMonday = mondayOffset[short] ?? 0;
  return new Date(todayStart.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
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
