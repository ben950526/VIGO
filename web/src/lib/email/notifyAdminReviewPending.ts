import type { AdminReviewNotifyKind } from "@/lib/email/adminReviewNotifyHtml";
import { enqueueReviewEvent } from "@/lib/review-queue/enqueueReviewEvent";

/** 送審時寫入佇列，由每日摘要 Email 通知管理員 */
export async function notifyAdminReviewPending(params: {
  kind: AdminReviewNotifyKind;
  studioName: string;
  slug: string;
  portfolioTitle?: string;
}): Promise<void> {
  try {
    await enqueueReviewEvent(params);
  } catch (err) {
    console.error("[review-queue] notifyAdminReviewPending:", err);
  }
}
