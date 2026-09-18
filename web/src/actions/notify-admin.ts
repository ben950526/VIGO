"use server";

import { notifyAdminReviewPending } from "@/lib/email/notifyAdminReviewPending";

/** 註冊完成後由 client 呼叫，通知管理員有新創作者待審 */
export async function notifyAdminNewCreatorRegistration(studioName: string, slug: string) {
  const name = studioName.trim();
  const s = slug.trim();
  if (!name || !s) return;

  await notifyAdminReviewPending({
    kind: "new_creator",
    studioName: name,
    slug: s,
  });
}
