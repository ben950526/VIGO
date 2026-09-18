import {
  buildAdminReviewDigestHtml,
  digestRangeLabel,
  type DigestEventRow,
} from "@/lib/email/adminReviewDigestHtml";
import { adminNotifyEmail, emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";
import { createServiceClient } from "@/lib/supabase/service";
import { getYesterdayRangeInTaipei } from "@/lib/time/taipei";
import { Resend } from "resend";

export type DigestRunResult =
  | { ok: true; sent: boolean; count: number; reason?: string }
  | { ok: false; error: string };

export async function runDailyAdminReviewDigest(now = new Date()): Promise<DigestRunResult> {
  const to = adminNotifyEmail();
  if (!to) {
    return { ok: false, error: "ADMIN_EMAIL not configured" };
  }

  const apiKey = resendApiKey();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY not configured" };
  }

  const { start, end } = getYesterdayRangeInTaipei(now);

  const { data, error } = await supabase
    .from("review_submission_events")
    .select("id, kind, studio_name, slug, portfolio_title, created_at")
    .is("digested_at", null)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  const events = (data ?? []) as (DigestEventRow & { id: string })[];

  if (events.length === 0) {
    return { ok: true, sent: false, count: 0, reason: "no_events_yesterday" };
  }

  const reviewUrl = `${siteUrl()}/admin/review`;
  const rangeLabel = digestRangeLabel(start);
  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: emailFrom(),
    to,
    subject: `【Vigo 審核摘要】${rangeLabel} · ${events.length} 筆`,
    html: buildAdminReviewDigestHtml({ reviewUrl, rangeLabel, events }),
  });

  if (sendError) {
    return { ok: false, error: sendError.message };
  }

  const ids = events.map((e) => e.id);
  const { error: markError } = await supabase
    .from("review_submission_events")
    .update({ digested_at: new Date().toISOString() })
    .in("id", ids);

  if (markError) {
    console.error("[digest] failed to mark digested:", markError.message);
  }

  return { ok: true, sent: true, count: events.length };
}
