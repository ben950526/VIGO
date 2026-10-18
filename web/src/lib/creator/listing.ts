import type { CreatorProfile, PortfolioItem } from "@/types/database";
import { isDemoCreator } from "@/lib/demo-creator";

/** 探索頁／公開工作室：擋掉「無」「F」這類空殼，示範帳號的短介紹仍可過 */
export const MIN_PUBLIC_BIO_CHARS = 20;
/** 至少 1 支已審核作品才對外顯示；空殼目錄對發案者傷害更大 */
export const MIN_PUBLIC_APPROVED_WORKS = 1;

export type ExploreListingInput = Pick<
  CreatorProfile,
  "verification_status" | "is_listed"
> & {
  bio?: string | null;
  slug?: string;
  is_demo?: boolean;
  portfolio_items?: Pick<PortfolioItem, "status">[] | null;
  approvedWorkCount?: number;
};

export function countApprovedPortfolioItems(
  items?: Pick<PortfolioItem, "status">[] | null,
): number {
  return (items ?? []).filter((item) => item.status === "approved").length;
}

/** 探索頁先湊到這個數量就夠冷啟動；不必把所有空殼都救回來 */
export const EXPLORE_VISIBLE_TARGET = 30;
/** 後台每週只盯最接近上架的這幾間 */
export const EXPLORE_UNBLOCK_FOCUS_LIMIT = 10;

export type ExploreUnblockKind = "bio_only" | "work_only" | "both";

const EXPLORE_UNBLOCK_KIND_ORDER: Record<ExploreUnblockKind, number> = {
  bio_only: 0,
  work_only: 1,
  both: 2,
};

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

export function exploreUnblockKind(input: {
  bio?: string | null;
  portfolio_items?: Pick<PortfolioItem, "status">[] | null;
  approvedWorkCount?: number;
}): ExploreUnblockKind | null {
  const bioShort = (input.bio?.trim().length ?? 0) < MIN_PUBLIC_BIO_CHARS;
  const works =
    input.approvedWorkCount ?? countApprovedPortfolioItems(input.portfolio_items);
  const workShort = works < MIN_PUBLIC_APPROVED_WORKS;
  if (!bioShort && !workShort) return null;
  if (bioShort && !workShort) return "bio_only";
  if (!bioShort && workShort) return "work_only";
  return "both";
}

export function exploreUnblockKindLabel(kind: ExploreUnblockKind): string {
  if (kind === "bio_only") return "只差介紹（最快）";
  if (kind === "work_only") return "只差 1 支已過審作品";
  return "介紹和作品都還沒齊";
}

export function compareExploreUnblockKind(
  a: ExploreUnblockKind,
  b: ExploreUnblockKind,
): number {
  return EXPLORE_UNBLOCK_KIND_ORDER[a] - EXPLORE_UNBLOCK_KIND_ORDER[b];
}

export function isStudioContentReadyForExplore(input: {
  bio?: string | null;
  portfolio_items?: Pick<PortfolioItem, "status">[] | null;
  approvedWorkCount?: number;
}): boolean {
  return studioExploreContentGaps(input).length === 0;
}

/** 與探索頁／公開頁／敲門一致：真實接案者、已審核、未下架，且介紹與作品已達門檻 */
export function isCreatorVisibleOnExplore(creator: ExploreListingInput): boolean {
  if (isDemoCreator(creator)) return false;
  return (
    creator.verification_status === "approved" &&
    creator.is_listed !== false &&
    isStudioContentReadyForExplore(creator)
  );
}

/** 介紹已夠、且有待審或已通過作品：審核通過後就能上探索頁 */
export function isReadyForPriorityReview(input: {
  bio?: string | null;
  portfolio_items?: Pick<PortfolioItem, "status">[] | null;
}): boolean {
  if ((input.bio?.trim().length ?? 0) < MIN_PUBLIC_BIO_CHARS) return false;
  return (input.portfolio_items ?? []).some(
    (item) => item.status === "approved" || item.status === "pending",
  );
}
