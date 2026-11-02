/**
 * 發案者「要登入才能逛」的開關。Vercel 設 REQUIRE_CLIENT_LOGIN=1 才會生效；
 * Google 登入還沒設定好之前保持關閉，免得把所有人擋在門外。
 */
export function isClientLoginRequired(): boolean {
  return process.env.REQUIRE_CLIENT_LOGIN?.trim() === "1";
}

/** 需要登入才能看的公開頁 */
export function isGatedPublicPath(pathname: string): boolean {
  return pathname === "/explore" || pathname.startsWith("/creator/");
}

/** 只允許站內相對路徑，避免被拿來導去別的網站 */
export function safeNextPath(raw: string | null | undefined, fallback = "/explore"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
