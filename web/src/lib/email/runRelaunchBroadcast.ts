import { Resend } from "resend";
import {
  fetchBroadcastRecipients,
  type BroadcastRecipient,
} from "@/lib/email/broadcastRecipients";
import { emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";
import {
  buildRelaunchBroadcastHtml,
  RELAUNCH_BROADCAST_SUBJECT,
} from "@/lib/email/relaunchBroadcastHtml";

export type RelaunchRecipient = BroadcastRecipient;

export type RelaunchBroadcastOptions = {
  /** 只列出收件者，不寄信 */
  dryRun: boolean;
  /** 若設定，只寄給此 Email（仍會驗證是否在名單內，除非 forceTestTo） */
  testTo?: string;
  /** 與 testTo 合用：不查名單，強制寄一封測試 */
  forceTestTo?: boolean;
  /** 僅 verification_status = approved */
  onlyApproved: boolean;
  /** 每封間隔（毫秒），避免 Resend 速率限制 */
  delayMs: number;
};

export type RelaunchBroadcastResult = {
  ok: boolean;
  dryRun: boolean;
  recipientCount: number;
  sent: number;
  failed: number;
  recipients: RelaunchRecipient[];
  errors: string[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchRelaunchRecipients(
  onlyApproved: boolean,
): Promise<RelaunchRecipient[]> {
  return fetchBroadcastRecipients({ onlyApproved, audience: "creators" });
}

export async function runRelaunchBroadcast(
  options: RelaunchBroadcastOptions,
): Promise<RelaunchBroadcastResult> {
  const errors: string[] = [];
  let recipients = await fetchRelaunchRecipients(options.onlyApproved);

  if (options.testTo) {
    const test = options.testTo.trim().toLowerCase();
    if (options.forceTestTo) {
      recipients = [
        {
          email: options.testTo.trim(),
          studioName: "（測試）",
          verificationStatus: "approved",
        },
      ];
    } else {
      const match = recipients.find((r) => r.email.toLowerCase() === test);
      if (!match) {
        return {
          ok: false,
          dryRun: options.dryRun,
          recipientCount: 0,
          sent: 0,
          failed: 0,
          recipients: [],
          errors: [`--to 不在名單內：${options.testTo}（可加 --force-test-to 強制寄測試信）`],
        };
      }
      recipients = [match];
    }
  }

  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      recipientCount: recipients.length,
      sent: 0,
      failed: 0,
      recipients,
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
      recipients,
      errors: ["RESEND_API_KEY 未設定"],
    };
  }

  const resend = new Resend(apiKey);
  const from = emailFrom();
  const baseUrl = siteUrl();
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i]!;
    const { error } = await resend.emails.send({
      from,
      to: r.email,
      subject: RELAUNCH_BROADCAST_SUBJECT,
      html: buildRelaunchBroadcastHtml({
        siteUrl: baseUrl,
        studioName: r.studioName,
      }),
    });

    if (error) {
      failed++;
      errors.push(`${r.email}: ${error.message}`);
    } else {
      sent++;
    }

    if (i < recipients.length - 1 && options.delayMs > 0) {
      await sleep(options.delayMs);
    }
  }

  return {
    ok: failed === 0,
    dryRun: false,
    recipientCount: recipients.length,
    sent,
    failed,
    recipients,
    errors,
  };
}
