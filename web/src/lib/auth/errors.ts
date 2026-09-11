export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return "無法連線至登入服務，請稍後再試。若問題持續，可能是資料庫服務已暫停，請聯絡平台管理員。";
  }
  return message;
}
