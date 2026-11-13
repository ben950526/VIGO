import { Resend } from "resend";
import { isCreatorVisibleOnExplore, type ExploreListingInput } from "@/lib/creator/listing";
import type { PortfolioItem } from "@/types/database";
import { adminNotifyEmail, emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";
import { buildWeeklyMilestoneHtml, weeklyMilestoneSubject } from "@/lib/email/weeklyMilestoneHtml";
import { createServiceClient } from "@/lib/supabase/service";
import { startOfTaipeiWeek, taipeiDateString } from "@/lib/time/taipei";

/**
 * 每週一檢查「可以開始收費了嗎」與「停損日還有多久」，寄信給經營者。
 * 收費門檻（經營者決定）：連續 4 週每週非管理員敲門 ≥ 20，且活躍接案者 ≥ 40。
 * 活躍接案者：探索頁看得到（isCreatorVisibleOnExplore）＋ 30 天內登入、改過工作室或新增作品。
 * 停損（2026-11-11 決定）：上線 3 個月後每月 Google 搜尋進站仍 < 100 就停止開發；
 * 搜尋人數只能在 Search Console 看，網站讀不到，所以信裡只提醒倒數。
 */
export const KNOCK_WEEKLY_TARGET = 20;
export const ACTIVE_CREATOR_TARGET = 40;
export const CONSECUTIVE_WEEKS = 4;
export const ACTIVE_WINDOW_DAYS = 30;
export const STOP_LOSS_DATE = "2027-02-11";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export type WeekKnocks = { weekStart: string; knocks: number };

export type MilestoneReport = {
  weeks: WeekKnocks[];
  activeCreators: number;
  visibleCreators: number;
  monetizeReady: boolean;
  daysToStopLoss: number;
};

export type MilestoneRunResult =
  | { ok: true; sent: boolean; report: MilestoneReport }
  | { ok: false; error: string };

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;

async function resolveRecipients(supabase: ServiceClient): Promise<string[]> {
  const configured = adminNotifyEmail();
  if (configured) return [configured];
  // ADMIN_EMAIL 還沒設時，寄給 profiles.role = admin 的帳號
  const { data } = await supabase.from("profiles").select("email").eq("role", "admin");
  return (data ?? []).map((row) => row.email).filter(Boolean);
}

async function lastSignInByUser(supabase: ServiceClient): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;
    for (const user of data.users) {
      if (user.last_sign_in_at) map.set(user.id, user.last_sign_in_at);
    }
    if (data.users.length < 1000) break;
  }
  return map;
}

export async function computeMilestoneReport(
  supabase: ServiceClient,
  now = new Date(),
): Promise<MilestoneReport | { error: string }> {
  // 只看已經結束的完整週（週一～週日，台北時區）
  const thisWeekStart = startOfTaipeiWeek(now).getTime();
  const firstWeekStart = thisWeekStart - CONSECUTIVE_WEEKS * WEEK_MS;

  const { data: knockRows, error: knockError } = await supabase
    .from("knocks")
    .select("created_at, from_admin, user_agent")
    .gte("created_at", new Date(firstWeekStart).toISOString())
    .lt("created_at", new Date(thisWeekStart).toISOString());
  if (knockError) return { error: knockError.message };

  const weeks: WeekKnocks[] = Array.from({ length: CONSECUTIVE_WEEKS }, (_, i) => ({
    weekStart: taipeiDateString(new Date(firstWeekStart + i * WEEK_MS)),
    knocks: 0,
  }));
  for (const row of knockRows ?? []) {
    if (row.from_admin === true) continue;
    if (String(row.user_agent ?? "").startsWith("vigo-admin|")) continue;
    const idx = Math.floor((new Date(row.created_at).getTime() - firstWeekStart) / WEEK_MS);
    if (idx >= 0 && idx < CONSECUTIVE_WEEKS) weeks[idx].knocks += 1;
  }

  const { data: creators, error: creatorError } = await supabase
    .from("creator_profiles")
    .select("user_id, slug, bio, verification_status, is_listed, is_demo, updated_at, portfolio_items(status, created_at)")
    .eq("is_demo", false);
  if (creatorError) return { error: creatorError.message };

  const signIns = await lastSignInByUser(supabase);
  const activeSince = now.getTime() - ACTIVE_WINDOW_DAYS * DAY_MS;
  const recent = (iso?: string | null) => (iso ? new Date(iso).getTime() >= activeSince : false);

  let visibleCreators = 0;
  let activeCreators = 0;
  for (const creator of creators ?? []) {
    const items = ((creator.portfolio_items as unknown) ?? []) as (Pick<
      PortfolioItem,
      "status"
    > & { created_at: string })[];
    const listing = { ...creator, portfolio_items: items } as unknown as ExploreListingInput;
    if (!isCreatorVisibleOnExplore(listing)) continue;
    visibleCreators += 1;
    if (
      recent(signIns.get(creator.user_id)) ||
      recent(creator.updated_at) ||
      items.some((item) => recent(item.created_at))
    ) {
      activeCreators += 1;
    }
  }

  const monetizeReady =
    weeks.every((week) => week.knocks >= KNOCK_WEEKLY_TARGET) &&
    activeCreators >= ACTIVE_CREATOR_TARGET;

  const todayStart = new Date(`${taipeiDateString(now)}T00:00:00+08:00`).getTime();
  const stopLossStart = new Date(`${STOP_LOSS_DATE}T00:00:00+08:00`).getTime();
  const daysToStopLoss = Math.round((stopLossStart - todayStart) / DAY_MS);

  return { weeks, activeCreators, visibleCreators, monetizeReady, daysToStopLoss };
}

export async function runWeeklyMilestoneCheck(now = new Date()): Promise<MilestoneRunResult> {
  const apiKey = resendApiKey();
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };

  const supabase = createServiceClient();
  if (!supabase) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY not configured" };

  const report = await computeMilestoneReport(supabase, now);
  if ("error" in report) return { ok: false, error: report.error };

  const to = await resolveRecipients(supabase);
  if (to.length === 0) return { ok: false, error: "no admin recipient" };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to,
    subject: weeklyMilestoneSubject(report),
    html: buildWeeklyMilestoneHtml({ report, adminUrl: `${siteUrl()}/admin` }),
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true, sent: true, report };
}
