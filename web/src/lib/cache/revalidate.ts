import { revalidatePath, updateTag } from "next/cache";

export const CREATOR_LIST_TAG = "creators";

export function revalidateCreatorList(): void {
  updateTag(CREATOR_LIST_TAG);
}

/** 審核通過／下架等會影響公開列表的操作 */
export function revalidateAfterPublicCreatorChange(creatorSlug?: string): void {
  revalidatePath("/admin/review");
  updateTag(CREATOR_LIST_TAG);
  if (creatorSlug) {
    revalidatePath(`/creator/${creatorSlug}`);
  }
}

/** 僅影響審核佇列、不影響公開頁 */
export function revalidateAdminReviewOnly(): void {
  revalidatePath("/admin/review");
}
