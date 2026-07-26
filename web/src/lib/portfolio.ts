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
