import { REGIONS, SERVICE_TYPES, STYLE_TAGS } from "@/lib/constants";
import type { CreatorWithPortfolio } from "@/types/database";

/**
 * 給 Google 搜尋的工作室列表頁：/studios/region/台北市、/studios/service/剪輯、
 * /studios/style/知識型、/studios/region/台北市/剪輯。
 * 只產生「至少有工作室」的頁面，避免空頁被 Google 當成低品質內容。
 */
export type FacetKind = "region" | "service" | "style";

export const FACET_KINDS: FacetKind[] = ["region", "service", "style"];

const ALLOWED: Record<FacetKind, readonly string[]> = {
  region: REGIONS,
  service: SERVICE_TYPES,
  style: STYLE_TAGS,
};

/** 組合頁（地區×服務）至少要幾間才產生 */
export const MIN_COMBO_STUDIOS = 2;

export function isFacetKind(value: string): value is FacetKind {
  return (FACET_KINDS as string[]).includes(value);
}

/** 網址裡的中文可能是編碼過的，先解開再比對允許清單 */
export function parseFacetValue(kind: FacetKind, raw: string): string | null {
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  return ALLOWED[kind].includes(value) ? value : null;
}

export function facetPath(kind: FacetKind, value: string, service?: string): string {
  const base = `/studios/${kind}/${encodeURIComponent(value)}`;
  return service ? `${base}/${encodeURIComponent(service)}` : base;
}

export function matchesFacet(c: CreatorWithPortfolio, kind: FacetKind, value: string): boolean {
  if (kind === "region") return c.region === value;
  if (kind === "service") return (c.service_types ?? []).includes(value);
  return (c.style_tags ?? []).includes(value);
}

/** 「台北市」→「台北」，標題比較口語 */
function shortRegion(region: string): string {
  return region.replace(/[市縣]$/, "");
}

export function facetHeading(kind: FacetKind, value: string, service?: string): string {
  if (kind === "region" && service) return `${shortRegion(value)}短影音${service}工作室推薦`;
  if (kind === "region") return `${shortRegion(value)}短影音剪輯工作室推薦`;
  if (kind === "service") return `短影音${value}工作室推薦`;
  return `${value}風格短影音剪輯推薦`;
}

export function facetIntro(kind: FacetKind, value: string, count: number, service?: string): string {
  const n = `${count} 間`;
  if (kind === "region" && service) {
    return `在 Vigo 找${shortRegion(value)}的短影音${service}工作室：目前有 ${n}審核過的工作室，可以先看作品、比較風格與價格，對到再直接聯絡，平台不抽成。`;
  }
  if (kind === "region") {
    return `想找${shortRegion(value)}的短影音剪輯、拍攝或 Reels 製作？這裡有 ${n}在${shortRegion(value)}的審核過工作室，先看作品集再決定，聯絡方式直接給你，不經過平台、不抽成。`;
  }
  if (kind === "service") {
    return `需要短影音${value}？Vigo 整理了 ${n}提供${value}的審核過工作室，每間都有真實作品可以看，風格對了再敲門拿聯絡方式。`;
  }
  return `喜歡「${value}」風格的短影音？這裡有 ${n}擅長${value}的工作室，直接看他們做過的片子，找到對的人再聯絡。`;
}

export type FacetPage = { kind: FacetKind; value: string; service?: string; count: number };

/** 依目前探索頁可見的工作室，算出哪些搜尋頁值得產生 */
export function listFacetPages(creators: CreatorWithPortfolio[]): FacetPage[] {
  const pages: FacetPage[] = [];
  for (const kind of FACET_KINDS) {
    for (const value of ALLOWED[kind]) {
      const count = creators.filter((c) => matchesFacet(c, kind, value)).length;
      if (count > 0) pages.push({ kind, value, count });
    }
  }
  for (const region of REGIONS) {
    for (const service of SERVICE_TYPES) {
      const count = creators.filter(
        (c) => matchesFacet(c, "region", region) && matchesFacet(c, "service", service),
      ).length;
      if (count >= MIN_COMBO_STUDIOS) pages.push({ kind: "region", value: region, service, count });
    }
  }
  return pages;
}
