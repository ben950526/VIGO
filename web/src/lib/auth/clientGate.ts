/**
 * 發案者「要登入才能敲門」的開關（Vercel 設 REQUIRE_CLIENT_LOGIN=1 才生效）。
 * 2026-11-11 起只擋敲門，逛探索頁與工作室頁不用登入。
 */
export function isClientLoginRequired(): boolean {
  return process.env.REQUIRE_CLIENT_LOGIN?.trim() === "1";
}

/** 只允許站內相對路徑，避免被拿來導去別的網站 */
export function safeNextPath(raw: string | null | undefined, fallback = "/explore"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
