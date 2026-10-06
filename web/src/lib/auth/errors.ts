export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return "無法連線至登入服務，請稍後再試。若問題持續，可能是資料庫服務已暫停，請聯絡平台管理員。";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email 或密碼不正確";
  }
  if (lower.includes("rate limit") || lower.includes("security purposes")) {
    return "寄信次數太頻繁，請稍後再試";
  }
  if (lower.includes("at least") && lower.includes("password")) {
    return "密碼至少 6 碼";
  }
  if (lower.includes("session") && (lower.includes("missing") || lower.includes("expired"))) {
    return "重設連結無效或已過期，請重新申請";
  }
  return message;
}
