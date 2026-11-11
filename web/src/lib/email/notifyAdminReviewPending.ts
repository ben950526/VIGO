import type { AdminReviewNotifyKind } from "@/lib/email/adminReviewNotifyHtml";
import { enqueueReviewEvent } from "@/lib/review-queue/enqueueReviewEvent";

// 2026-11-11 起取消人工審核（migration 036 自動通過），不再通知管理員審核
const MANUAL_REVIEW_ENABLED = false;

/** 送審時寫入佇列，由每日摘要 Email 通知管理員（目前關閉） */
export async function notifyAdminReviewPending(params: {
  kind: AdminReviewNotifyKind;
  studioName: string;
  slug: string;
  portfolioTitle?: string;
}): Promise<void> {
  if (!MANUAL_REVIEW_ENABLED) return;
  try {
    await enqueueReviewEvent(params);
  } catch (err) {
    console.error("[review-queue] notifyAdminReviewPending:", err);
  }
}
