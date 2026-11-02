import { getApprovedCreators } from "@/lib/data/creators";
import {
  buildClientNudgeHtml,
  clientNudgeSubject,
  type ClientNudgeDay,
  type ClientNudgeStudio,
} from "@/lib/email/clientNudgeHtml";
import { adminNotifyEmail, emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";
import { createServiceClient } from "@/lib/supabase/service";
import { startOfTaipeiDay, taipeiDateString } from "@/lib/time/taipei";
import { Resend } from "resend";

/** 只掃最近登入的發案者；第 7 天信最多延一天補寄 */
const LOOKBACK_DAYS = 8;
const STUDIOS_PER_EMAIL = 5;

export type ClientNudgeResult = {
  ok: boolean;
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
  error?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function taipeiCalendarAgeDays(createdAt: string, now: Date): number {
  const createdDay = startOfTaipeiDay(taipeiDateString(new Date(createdAt)));
  const today = startOfTaipeiDay(taipeiDateString(now));
  return Math.floor((today.getTime() - createdDay.getTime()) / DAY_MS);
}

function nextNudgeDay(row: {
  ageDays: number;
  sent1: string | null;
  sent3: string | null;
  sent7: string | null;
}): ClientNudgeDay | null {
  if ((row.ageDays === 1 || row.ageDays === 2) && !row.sent1) return 1;
  if ((row.ageDays === 3 || row.ageDays === 4) && !row.sent3) return 3;
  if ((row.ageDays === 7 || row.ageDays === 8) && !row.sent7) return 7;
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 第 1 天：作品多的前幾間；第 7 天：最近加入的幾間（兩封盡量不重複） */
async function pickStudios(baseUrl: string) {
  const creators = await getApprovedCreators();
  const toItem = (c: (typeof creators)[number]): ClientNudgeStudio => ({
    name: c.studio_name,
    url: `${baseUrl}/creator/${c.slug}`,
    tags: c.style_tags ?? [],
    region: c.region ?? null,
  });
  const byWorks = [...creators]
    .sort((a, b) => (b.portfolio_items?.length ?? 0) - (a.portfolio_items?.length ?? 0))
    .slice(0, STUDIOS_PER_EMAIL);
  const picked = new Set(byWorks.map((c) => c.id));
  const newest = [...creators]
    .filter((c) => !picked.has(c.id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, STUDIOS_PER_EMAIL);
  return { day1: byWorks.map(toItem), day7: newest.map(toItem) };
}

export async function runClientNudges(now = new Date()): Promise<ClientNudgeResult> {
  const empty = { scanned: 0, sent: 0, skipped: 0, failed: 0 };
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, ...empty, error: "SUPABASE_SERVICE_ROLE_KEY not configured" };
  const apiKey = resendApiKey();
  if (!apiKey) return { ok: false, ...empty, error: "RESEND_API_KEY not configured" };

  const todayStart = startOfTaipeiDay(taipeiDateString(now));
  const since = new Date(todayStart.getTime() - LOOKBACK_DAYS * DAY_MS);

  const { data: rows, error } = await supabase
    .from("profiles")
    .select(
      "id, email, created_at, client_marketing_consent_at, client_nudge_1d_sent_at, client_nudge_3d_sent_at, client_nudge_7d_sent_at, email_opt_out, unsubscribe_token",
    )
    .eq("role", "client")
    .eq("email_opt_out", false)
    .not("client_marketing_consent_at", "is", null)
    .gte("created_at", since.toISOString());

  if (error) {
    // 還沒跑 035：發案者提醒先不寄，不要讓整個 Cron 失敗
    if (error.message.includes("client_") || error.message.includes("email_opt_out")) {
      return { ok: true, ...empty, error: "尚未執行 035_client_login_nudges.sql，略過發案者提醒" };
    }
    return { ok: false, ...empty, error: error.message };
  }

  const list = rows ?? [];
  if (list.length === 0) return { ok: true, ...empty };

  const baseUrl = siteUrl();
  const studios = await pickStudios(baseUrl);
  const admin = adminNotifyEmail()?.toLowerCase();
  const resend = new Resend(apiKey);
  const from = emailFrom();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of list) {
    const day = nextNudgeDay({
      ageDays: taipeiCalendarAgeDays(row.created_at, now),
      sent1: row.client_nudge_1d_sent_at ?? null,
      sent3: row.client_nudge_3d_sent_at ?? null,
      sent7: row.client_nudge_7d_sent_at ?? null,
    });
    const email = (row.email ?? "").trim().toLowerCase();
    if (!day || !email || email === admin || email.endsWith("@vigo.local")) {
      skipped += 1;
      continue;
    }

    const { error: sendError } = await resend.emails.send({
      from,
      to: email,
      subject: clientNudgeSubject(day),
      html: buildClientNudgeHtml({
        day,
        studios: day === 1 ? studios.day1 : day === 7 ? studios.day7 : [],
        exploreUrl: `${baseUrl}/explore`,
        unsubscribeUrl: `${baseUrl}/unsubscribe?t=${row.unsubscribe_token}`,
      }),
    });
    if (sendError) {
      console.error("[client-nudge] send failed", row.id, sendError.message);
      failed += 1;
      continue;
    }

    const stampedAt = new Date().toISOString();
    const stamp =
      day === 1
        ? { client_nudge_1d_sent_at: stampedAt }
        : day === 3
          ? { client_nudge_3d_sent_at: stampedAt }
          : { client_nudge_7d_sent_at: stampedAt };
    const { error: stampError } = await supabase.from("profiles").update(stamp).eq("id", row.id);
    if (stampError) console.error("[client-nudge] stamp failed", row.id, stampError.message);

    sent += 1;
    await sleep(600);
  }

  return { ok: failed === 0, scanned: list.length, sent, skipped, failed };
}
