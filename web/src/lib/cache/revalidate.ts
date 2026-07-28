import { revalidatePath, updateTag } from "next/cache";

export const CREATOR_LIST_TAG = "creators";

export function revalidateCreatorList(): void {
  updateTag(CREATOR_LIST_TAG);
}

/** 審核通過／下架等會影響公開列表的操作（不刷審核頁，form action 會自動 refresh） */
export function revalidateAfterPublicCreatorChange(creatorSlug?: string): void {
  updateTag(CREATOR_LIST_TAG);
  if (creatorSlug) {
    revalidatePath(`/creator/${creatorSlug}`);
  }
}

/** 審核頁僅影響佇列時不需額外 revalidatePath */
export function revalidateAdminReviewOnly(): void {
  // Server Action 提交後 Next.js 會自動 refresh 當前頁
}
