import type { PriceListItem } from "@/types/database";

export function parsePriceList(raw: unknown): PriceListItem[] {
  if (!Array.isArray(raw)) return [];
  const items: PriceListItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const label = String(row.label ?? "").trim();
    const price = Number(row.price);
    if (!label || !Number.isFinite(price) || price < 0) continue;
    const note = row.note ? String(row.note).trim() : null;
    items.push({ label, price, note: note || null });
  }
  return items;
}

export function formatPriceTWD(amount: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amount);
}
