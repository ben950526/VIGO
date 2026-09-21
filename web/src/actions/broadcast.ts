"use server";

import { requireAdmin } from "@/lib/auth/admin";
import type { BroadcastAudience } from "@/lib/email/broadcastRecipients";
import { countBroadcastRecipients, runCustomBroadcast } from "@/lib/email/runCustomBroadcast";

export type BroadcastFormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  recipientCount?: number;
  sent?: number;
  failed?: number;
  errors?: string[];
};

const CONFIRM_PHRASE = "確認發送";

function parseAudience(value: string | null | undefined): BroadcastAudience {
  return value === "all_registered" ? "all_registered" : "creators";
}

export async function getBroadcastRecipientCount(
  onlyApproved: boolean,
  audience: BroadcastAudience,
): Promise<{ count: number; error?: string }> {
  try {
    await requireAdmin();
    const count = await countBroadcastRecipients({ onlyApproved, audience });
    return { count };
  } catch (err) {
    const message = err instanceof Error ? err.message : "無法讀取名單";
    return { count: 0, error: message };
  }
}

export async function sendAdminBroadcast(
  _prev: BroadcastFormState | null,
  formData: FormData,
): Promise<BroadcastFormState> {
  await requireAdmin();

  const subject = String(formData.get("subject") ?? "").trim();
  const bodyPlain = String(formData.get("body") ?? "").trim();
  const onlyApproved = formData.get("only_approved") === "on";
  const audience = parseAudience(String(formData.get("audience") ?? ""));
  const confirm = String(formData.get("confirm") ?? "").trim();
  const intent = String(formData.get("intent") ?? "send");

  if (!subject || !bodyPlain) {
    return { ok: false, error: "請填寫主旨與內文" };
  }

  if (intent === "test") {
    const testTo = String(formData.get("test_email") ?? "").trim();
    if (!testTo) {
      return { ok: false, error: "測試寄送請填寫你的 Email" };
    }

    const result = await runCustomBroadcast({
      subject: `[測試] ${subject}`,
      bodyPlain,
      onlyApproved,
      audience,
      dryRun: false,
      testTo,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.errors[0] ?? "測試寄送失敗",
        errors: result.errors,
      };
    }

    return {
      ok: true,
      message: `已寄出測試信至 ${testTo}`,
      sent: result.sent,
    };
  }

  if (confirm !== CONFIRM_PHRASE) {
    return { ok: false, error: `正式群發請在確認欄輸入「${CONFIRM_PHRASE}」` };
  }

  const result = await runCustomBroadcast({
    subject,
    bodyPlain,
    onlyApproved,
    audience,
    dryRun: false,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.errors[0] ?? "群發失敗",
      recipientCount: result.recipientCount,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.slice(0, 10),
    };
  }

  return {
    ok: true,
    message: `群發完成：共 ${result.recipientCount} 人，成功 ${result.sent} 封`,
    recipientCount: result.recipientCount,
    sent: result.sent,
    failed: result.failed,
  };
}
