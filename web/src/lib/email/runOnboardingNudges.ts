import { studioSubmitGaps } from "@/lib/creator/studioSubmit";
import { adminNotifyEmail, emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";
import {
  buildOnboardingNudgeHtml,
  onboardingNudgeSubject,
  type OnboardingNudgeDay,
} from "@/lib/email/onboardingNudgeHtml";
import { createServiceClient } from "@/lib/supabase/service";
import { startOfTaipeiDay, taipeiDateString } from "@/lib/time/taipei";
import { Resend } from "resend";

const LOOKBACK_DAYS = 14;

export type OnboardingNudgeResult = {
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

function taipeiCalendarAgeDays(createdAt: string, now: Date): number {
  const createdDay = startOfTaipeiDay(taipeiDateString(new Date(createdAt)));
  const today = startOfTaipeiDay(taipeiDateString(now));
  return Math.floor((today.getTime() - createdDay.getTime()) / (24 * 60 * 60 * 1000));
}

function nextNudgeDay(params: {
  ageDays: number;
  sent1: string | null;
  sent3: string | null;
  sent7: string | null;
}): OnboardingNudgeDay | null {
  const { ageDays, sent1, sent3, sent7 } = params;
  if (ageDays >= 1 && !sent1) return 1;
  if (ageDays >= 3 && !sent3) return 3;
  if (ageDays >= 7 && !sent7) return 7;
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 與舊 Cron 呼叫相容 */
export async function runDay3OnboardingReminders(now = new Date()) {
  return runOnboardingNudges(now);
}

export async function runOnboardingNudges(now = new Date()): Promise<OnboardingNudgeResult> {
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

  const since = startOfTaipeiDaysAgo(LOOKBACK_DAYS, now);

  const { data: creators, error } = await supabase
    .from("creator_profiles")
    .select(
      "id, user_id, slug, studio_name, bio, region, service_types, style_tags, contact_email, line_id, phone, is_demo, created_at, onboarding_nudge_1d_sent_at, onboarding_nudge_3d_sent_at, onboarding_nudge_7d_sent_at",
    )
    .eq("is_demo", false)
    .gte("created_at", since.toISOString());

  if (error) {
    const missingCol =
      error.message.includes("onboarding_nudge_") || error.message.includes("schema cache");
    return {
      ok: false,
      scanned: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      error: missingCol
        ? "請先在 Supabase SQL Editor 執行 supabase/migrations/024_onboarding_nudges_1_3_7.sql"
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

    const ageDays = taipeiCalendarAgeDays(row.created_at, now);
    const day = nextNudgeDay({
      ageDays,
      sent1: row.onboarding_nudge_1d_sent_at,
      sent3: row.onboarding_nudge_3d_sent_at,
      sent7: row.onboarding_nudge_7d_sent_at,
    });
    if (!day) {
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
      subject: onboardingNudgeSubject(day),
      html: buildOnboardingNudgeHtml({
        day,
        studioName: row.studio_name,
        missing,
        studioEditUrl: `${baseUrl}/dashboard/studio`,
        dashboardUrl: `${baseUrl}/dashboard`,
      }),
    });

    if (sendError) {
      console.error("[onboarding-nudge] send failed", email, sendError.message);
      failed += 1;
      continue;
    }

    const stampedAt = new Date().toISOString();
    const stamp =
      day === 1
        ? { onboarding_nudge_1d_sent_at: stampedAt }
        : day === 3
          ? { onboarding_nudge_3d_sent_at: stampedAt }
          : { onboarding_nudge_7d_sent_at: stampedAt };
    const { error: stampError } = await supabase
      .from("creator_profiles")
      .update(stamp)
      .eq("id", row.id);

    if (stampError) {
      console.error("[onboarding-nudge] stamp failed", row.id, stampError.message);
    }

    sent += 1;
    await sleep(600);
  }

  return { ok: failed === 0, scanned: rows.length, sent, skipped, failed };
}
