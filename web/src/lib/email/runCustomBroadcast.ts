import { Resend } from "resend";
import { buildAdminBroadcastHtml } from "@/lib/email/buildAdminBroadcastHtml";
import {
  fetchBroadcastRecipients,
  type BroadcastAudience,
  type BroadcastRecipient,
} from "@/lib/email/broadcastRecipients";
import { emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";

const RESEND_BATCH_SIZE = 100;
const BATCH_GAP_MS = 800;

export type CustomBroadcastOptions = {
  subject: string;
  bodyPlain: string;
  onlyApproved: boolean;
  audience: BroadcastAudience;
  dryRun: boolean;
  /** 只寄給此地址（測試） */
  testTo?: string;
};

export type CustomBroadcastResult = {
  ok: boolean;
  dryRun: boolean;
  recipientCount: number;
  sent: number;
  failed: number;
  errors: string[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runCustomBroadcast(
  options: CustomBroadcastOptions,
): Promise<CustomBroadcastResult> {
  const subject = options.subject.trim();
  const bodyPlain = options.bodyPlain.trim();

  if (!subject || !bodyPlain) {
    return {
      ok: false,
      dryRun: options.dryRun,
      recipientCount: 0,
      sent: 0,
      failed: 0,
      errors: ["主旨與內文不可為空"],
    };
  }

  let recipients = await fetchBroadcastRecipients({
    onlyApproved: options.onlyApproved,
    audience: options.audience,
  });

  if (options.testTo) {
    const test = options.testTo.trim().toLowerCase();
    const match = recipients.find((r) => r.email.toLowerCase() === test);
    recipients = [
      match ?? {
        email: options.testTo.trim(),
        studioName: "（測試）",
        verificationStatus: "approved",
      },
    ];
  }

  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      recipientCount: recipients.length,
      sent: 0,
      failed: 0,
      errors: [],
    };
  }

  const apiKey = resendApiKey();
  if (!apiKey) {
    return {
      ok: false,
      dryRun: false,
      recipientCount: recipients.length,
      sent: 0,
      failed: recipients.length,
      errors: ["RESEND_API_KEY 未設定"],
    };
  }

  const resend = new Resend(apiKey);
  const from = emailFrom();
  const baseUrl = siteUrl();
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += RESEND_BATCH_SIZE) {
    const chunk = recipients.slice(i, i + RESEND_BATCH_SIZE);
    const payload = chunk.map((r) => ({
      from,
      to: r.email,
      subject,
      html: buildAdminBroadcastHtml({
        siteUrl: baseUrl,
        studioName: r.studioName,
        bodyPlain,
      }),
    }));

    const { data, error } = await resend.batch.send(payload);

    if (error) {
      failed += chunk.length;
      errors.push(`批次 ${Math.floor(i / RESEND_BATCH_SIZE) + 1}: ${error.message}`);
    } else {
      sent += data?.data?.length ?? chunk.length;
    }

    if (i + RESEND_BATCH_SIZE < recipients.length) {
      await sleep(BATCH_GAP_MS);
    }
  }

  return {
    ok: failed === 0,
    dryRun: false,
    recipientCount: recipients.length,
    sent,
    failed,
    errors,
  };
}

export async function countBroadcastRecipients(options: {
  onlyApproved: boolean;
  audience: BroadcastAudience;
}): Promise<number> {
  const list = await fetchBroadcastRecipients(options);
  return list.length;
}
