/** 必填欄沒想法時，常見會填「無」「F」當占位，不能當工作室名 */
const PLACEHOLDER_NAMES = new Set([
  "無",
  "没有",
  "沒有",
  "無名稱",
  "未命名",
  "尚未命名",
  "工作室",
  "f",
  "n",
  "x",
  "xx",
  "n/a",
  "na",
  "none",
  "null",
  "test",
  "testing",
  "-",
  "—",
  ".",
]);

export function normalizeStudioName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isPlaceholderStudioName(raw: string | null | undefined): boolean {
  const name = normalizeStudioName(raw ?? "");
  if (name.length < 2) return true;
  return PLACEHOLDER_NAMES.has(name.toLowerCase()) || PLACEHOLDER_NAMES.has(name);
}

export const PLACEHOLDER_STUDIO_NAME_ERROR =
  "請填真實工作室或品牌名稱，不要填「無」或單一字。沒有店名可用你的名字。";
