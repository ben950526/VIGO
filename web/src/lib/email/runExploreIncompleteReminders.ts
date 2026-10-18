import {
  EXPLORE_UNBLOCK_FOCUS_LIMIT,
  compareExploreUnblockKind,
  exploreUnblockKind,
  studioExploreContentGaps,
} from "@/lib/creator/listing";
import { adminNotifyEmail, emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";
import { buildIncompleteStudioReminderHtml } from "@/lib/email/incompleteStudioReminderHtml";
import { createServiceClient } from "@/lib/supabase/service";
import { Resend } from "resend";

export type ExploreIncompleteReminderResult = {
  ok: boolean;
  incomplete: number;
  sent: number;
  failed: number;
  skipped: number;
  error?: string;
};

const RESEND_BATCH_SIZE = 50;
const BATCH_GAP_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runExploreIncompleteReminders(options?: {
  closestOnly?: boolean;
}): Promise<ExploreIncompleteReminderResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      ok: false,
      incomplete: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: "缺少 SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  const { data: creators, error } = await supabase
    .from("creator_profiles")
    .select("id, user_id, slug, studio_name, bio, contact_email, is_listed, is_demo")
    .eq("is_demo", false)
    .eq("verification_status", "approved")
    .neq("is_listed", false);

  if (error) {
    return {
      ok: false,
      incomplete: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: error.message,
    };
  }

  const ids = (creators ?? []).map((row) => row.id);
  const { data: works } = await supabase
    .from("portfolio_items")
    .select("creator_id, status")
    .in("creator_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const approvedWorkCount = new Map<string, number>();
  for (const work of works ?? []) {
    if (work.status !== "approved") continue;
    approvedWorkCount.set(
      work.creator_id,
      (approvedWorkCount.get(work.creator_id) ?? 0) + 1,
    );
  }

  const userIds = [...new Set((creators ?? []).map((row) => row.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds);
  const emailByUser = new Map(
    (profiles ?? []).map((row) => [row.id, (row.email ?? "").trim().toLowerCase()] as const),
  );

  const admin = adminNotifyEmail()?.toLowerCase();
  const incomplete = (creators ?? [])
    .map((row) => {
      const input = {
        bio: row.bio,
        approvedWorkCount: approvedWorkCount.get(row.id) ?? 0,
      };
      const missing = studioExploreContentGaps(input);
      const kind = exploreUnblockKind(input) ?? "both";
      const email = emailByUser.get(row.user_id) || row.contact_email?.trim().toLowerCase() || "";
      return { row, missing, kind, email };
    })
    .filter((item) => item.missing.length > 0)
    .sort((a, b) => compareExploreUnblockKind(a.kind, b.kind));

  const toSend = options?.closestOnly
    ? incomplete.slice(0, EXPLORE_UNBLOCK_FOCUS_LIMIT)
    : incomplete;

  const apiKey = resendApiKey();
  if (!apiKey) {
    return {
      ok: false,
      incomplete: incomplete.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: "RESEND_API_KEY not configured",
    };
  }

  const payloads: { from: string; to: string; subject: string; html: string }[] = [];
  let skipped = 0;
  const seen = new Set<string>();
  const baseUrl = siteUrl();
  const from = emailFrom();

  for (const item of toSend) {
    const email = item.email;
    if (
      !email ||
      email.endsWith("@vigo.local") ||
      email.startsWith("demo-") ||
      email === admin
    ) {
      skipped += 1;
      continue;
    }
    if (seen.has(email)) {
      skipped += 1;
      continue;
    }
    seen.add(email);
    payloads.push({
      from,
      to: email,
      subject: `【Vigo】${item.row.studio_name} 還差一點，補了就會出現在探索頁`,
      html: buildIncompleteStudioReminderHtml({
        studioName: item.row.studio_name,
        missing: item.missing,
        studioEditUrl: `${baseUrl}/dashboard/studio`,
        dashboardUrl: `${baseUrl}/dashboard`,
      }),
    });
  }

  const resend = new Resend(apiKey);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < payloads.length; i += RESEND_BATCH_SIZE) {
    const chunk = payloads.slice(i, i + RESEND_BATCH_SIZE);
    const { data, error } = await resend.batch.send(chunk);
    if (error) {
      failed += chunk.length;
      console.error("[explore-incomplete] batch failed", error.message);
    } else {
      sent += data?.data?.length ?? chunk.length;
    }
    if (i + RESEND_BATCH_SIZE < payloads.length) {
      await sleep(BATCH_GAP_MS);
    }
  }

  return {
    ok: failed === 0,
    incomplete: incomplete.length,
    sent,
    failed,
    skipped,
  };
}
