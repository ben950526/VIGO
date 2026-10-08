import { studioSubmitGaps } from "@/lib/creator/studioSubmit";
import { adminNotifyEmail, emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";
import {
  DAY3_ONBOARDING_SUBJECT,
  buildDay3OnboardingReminderHtml,
} from "@/lib/email/day3OnboardingReminderHtml";
import { createServiceClient } from "@/lib/supabase/service";
import { startOfTaipeiDay, taipeiDateString } from "@/lib/time/taipei";
import { Resend } from "resend";

const MIN_AGE_DAYS = 3;
const MAX_AGE_DAYS = 7;

export type Day3ReminderResult = {
  ok: boolean;
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
  error?: string;
};

function startOfTaipeiDaysAgo(days: number, now: Date): Date {
  const todayStart = startOfTaipeiDay(taipeiDateString(now));
  return new Date(todayStart.getTime() - days * 24 * 60 * 60 * 1000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runDay3OnboardingReminders(
  now = new Date(),
): Promise<Day3ReminderResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      ok: false,
      scanned: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      error: "SUPABASE_SERVICE_ROLE_KEY not configured",
    };
  }

  const apiKey = resendApiKey();
  if (!apiKey) {
    return {
      ok: false,
      scanned: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      error: "RESEND_API_KEY not configured",
    };
  }

  // 台北日曆：註冊滿第 3 天起可寄，最晚第 7 天（Cron 漏跑仍補得上），每人只寄一次
  const olderThan = startOfTaipeiDaysAgo(MIN_AGE_DAYS - 1, now);
  const newerThan = startOfTaipeiDaysAgo(MAX_AGE_DAYS, now);

  const { data: creators, error } = await supabase
    .from("creator_profiles")
    .select(
      "id, user_id, slug, studio_name, bio, region, service_types, style_tags, contact_email, line_id, phone, is_demo, created_at, onboarding_day3_sent_at",
    )
    .eq("is_demo", false)
    .is("onboarding_day3_sent_at", null)
    .gte("created_at", newerThan.toISOString())
    .lt("created_at", olderThan.toISOString());

  if (error) {
    const missingCol =
      error.message.includes("onboarding_day3_sent_at") ||
      error.message.includes("schema cache");
    return {
      ok: false,
      scanned: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      error: missingCol
        ? "請先在 Supabase SQL Editor 執行 supabase/migrations/023_onboarding_day3_sent.sql"
        : error.message,
    };
  }

  const rows = creators ?? [];
  if (rows.length === 0) {
    return { ok: true, scanned: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const ids = rows.map((r) => r.id);
  const { data: works } = await supabase
    .from("portfolio_items")
    .select("creator_id, status")
    .in("creator_id", ids);

  const hasWork = new Set<string>();
  for (const w of works ?? []) {
    if (w.status === "rejected") continue;
    hasWork.add(w.creator_id);
  }

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds);
  const emailByUser = new Map(
    (profiles ?? []).map((p) => [p.id, (p.email ?? "").trim().toLowerCase()] as const),
  );

  const admin = adminNotifyEmail()?.toLowerCase();
  const baseUrl = siteUrl();
  const resend = new Resend(apiKey);
  const from = emailFrom();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const gaps = studioSubmitGaps({
      studio_name: row.studio_name,
      bio: row.bio,
      region: row.region,
      service_types: row.service_types ?? [],
      style_tags: row.style_tags ?? [],
      contact_email: row.contact_email,
      line_id: row.line_id,
      phone: row.phone,
    });
    const missing = [...gaps];
    if (!hasWork.has(row.id)) missing.push("至少 1 支 YouTube／Reels 作品");
    if (missing.length === 0) {
      skipped += 1;
      continue;
    }

    const email = (row.contact_email?.trim() || emailByUser.get(row.user_id) || "").toLowerCase();
    if (!email || email.endsWith("@vigo.local") || email.startsWith("demo-") || email === admin) {
      skipped += 1;
      continue;
    }

    const { error: sendError } = await resend.emails.send({
      from,
      to: email,
      subject: DAY3_ONBOARDING_SUBJECT,
      html: buildDay3OnboardingReminderHtml({
        studioName: row.studio_name,
        missing,
        studioEditUrl: `${baseUrl}/dashboard/studio`,
        dashboardUrl: `${baseUrl}/dashboard`,
      }),
    });

    if (sendError) {
      console.error("[day3-onboarding] send failed", email, sendError.message);
      failed += 1;
      continue;
    }

    const { error: stampError } = await supabase
      .from("creator_profiles")
      .update({ onboarding_day3_sent_at: new Date().toISOString() })
      .eq("id", row.id);

    if (stampError) {
      console.error("[day3-onboarding] stamp failed", row.id, stampError.message);
    }

    sent += 1;
    await sleep(600);
  }

  return { ok: failed === 0, scanned: rows.length, sent, skipped, failed };
}
