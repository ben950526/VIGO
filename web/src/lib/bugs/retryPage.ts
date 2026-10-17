const FALLBACK_RETRY_PATH = "/dashboard";

/** 把回報當時的頁面轉成站內路徑，完整網址也能用。 */
export function pathFromBugPageUrl(pageUrl: string | null | undefined): string {
  const raw = pageUrl?.trim();
  if (!raw) return FALLBACK_RETRY_PATH;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return FALLBACK_RETRY_PATH;
    }
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return path || FALLBACK_RETRY_PATH;
  } catch {
    return FALLBACK_RETRY_PATH;
  }
}

function currentPath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/** 一定會離開或重整，避免 Next.js 連到同一頁時像沒反應。 */
export function goRetryBugPage(pageUrl: string | null | undefined): void {
  const dest = pathFromBugPageUrl(pageUrl);
  if (currentPath() === dest) {
    window.location.reload();
    return;
  }
  window.location.assign(dest);
}

export function bugTriedStorageKey(reportId: string): string {
  return `vigo-bug-tried:${reportId}`;
}
