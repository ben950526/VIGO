import type { CreatorProfile } from "@/types/database";

/** 與探索頁／公開 RLS 一致：已審核且未主動下架（null 視同上架，與舊資料相容） */
export function isCreatorVisibleOnExplore(
  creator: Pick<CreatorProfile, "verification_status" | "is_listed">,
): boolean {
  return creator.verification_status === "approved" && creator.is_listed !== false;
}
