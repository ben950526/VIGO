import type { PortfolioItem } from "@/types/database";

export function getFeaturedPortfolioItem(
  items: PortfolioItem[],
): PortfolioItem | undefined {
  return [...items]
    .filter((item) => item.status === "approved")
    .sort((a, b) => a.sort_order - b.sort_order)[0];
}

export function isFeaturedPortfolioItem(
  item: PortfolioItem,
  items: PortfolioItem[],
): boolean {
  const featured = getFeaturedPortfolioItem(items);
  return featured?.id === item.id;
}

/** 預覽用：優先已通過的精選，否則取排序第一（含待審） */
export function getFeaturedPortfolioItemForPreview(
  items: PortfolioItem[],
): PortfolioItem | undefined {
  const approved = getFeaturedPortfolioItem(items);
  if (approved) return approved;
  return [...items].sort((a, b) => a.sort_order - b.sort_order)[0];
}
