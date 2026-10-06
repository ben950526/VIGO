import type { CreatorProfile, PortfolioItem } from "@/types/database";

/** 探索頁／公開工作室：擋掉「無」「F」這類空殼，示範帳號的短介紹仍可過 */
export const MIN_PUBLIC_BIO_CHARS = 20;
/** 至少 1 支已審核作品才對外顯示；空殼目錄對發案者傷害更大 */
export const MIN_PUBLIC_APPROVED_WORKS = 1;

export type ExploreListingInput = Pick<
  CreatorProfile,
  "verification_status" | "is_listed"
> & {
  bio?: string | null;
  portfolio_items?: Pick<PortfolioItem, "status">[] | null;
  approvedWorkCount?: number;
};

export function countApprovedPortfolioItems(
  items?: Pick<PortfolioItem, "status">[] | null,
): number {
  return (items ?? []).filter((item) => item.status === "approved").length;
}

export function studioExploreContentGaps(input: {
  bio?: string | null;
  portfolio_items?: Pick<PortfolioItem, "status">[] | null;
  approvedWorkCount?: number;
}): string[] {
  const gaps: string[] = [];
  if ((input.bio?.trim().length ?? 0) < MIN_PUBLIC_BIO_CHARS) {
    gaps.push("介紹至少約 20 字");
  }
  const works =
    input.approvedWorkCount ?? countApprovedPortfolioItems(input.portfolio_items);
  if (works < MIN_PUBLIC_APPROVED_WORKS) {
    gaps.push(`至少 ${MIN_PUBLIC_APPROVED_WORKS} 支已通過審核的作品`);
  }
  return gaps;
}

export function isStudioContentReadyForExplore(input: {
  bio?: string | null;
  portfolio_items?: Pick<PortfolioItem, "status">[] | null;
  approvedWorkCount?: number;
}): boolean {
  return studioExploreContentGaps(input).length === 0;
}

/** 與探索頁／公開頁／敲門一致：已審核、未主動下架，且介紹與作品已達門檻 */
export function isCreatorVisibleOnExplore(creator: ExploreListingInput): boolean {
  return (
    creator.verification_status === "approved" &&
    creator.is_listed !== false &&
    isStudioContentReadyForExplore(creator)
  );
}
