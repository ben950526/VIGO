"use server";

import { notifyAdminReviewPending } from "@/lib/email/notifyAdminReviewPending";
import { sendSignupWelcomeEmail } from "@/lib/email/sendWelcomeEmail";

/** 註冊成功後由 client 呼叫：寄歡迎信，並把新工作室排進每日審核摘要 */
export async function afterCreatorSignup(params: {
  email: string;
  studioName: string;
  slug: string;
}): Promise<void> {
  const email = params.email.trim();
  const studioName = params.studioName.trim();
  const slug = params.slug.trim();
  if (!email || !studioName || !slug) return;

  const results = await Promise.allSettled([
    sendSignupWelcomeEmail({ to: email, studioName }),
    notifyAdminReviewPending({
      kind: "new_creator",
      studioName,
      slug,
    }),
  ]);

  const welcome = results[0];
  if (welcome.status === "fulfilled" && !welcome.value.ok) {
    console.error("[email] welcome send failed:", welcome.value.error);
  }
  if (welcome.status === "rejected") {
    console.error("[email] welcome send failed:", welcome.reason);
  }
}
