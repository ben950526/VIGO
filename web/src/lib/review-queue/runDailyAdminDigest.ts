import {
  buildAdminReviewDigestHtml,
  digestRangeLabel,
  digestSubject,
  type DigestBugRow,
  type DigestEventRow,
  type DigestFeedbackRow,
} from "@/lib/email/adminReviewDigestHtml";
import { adminNotifyEmail, emailFrom, resendApiKey, siteUrl } from "@/lib/email/config";
import { createServiceClient } from "@/lib/supabase/service";
import { getYesterdayRangeInTaipei } from "@/lib/time/taipei";
import { Resend } from "resend";

export type DigestRunResult =
  | {
      ok: true;
      sent: boolean;
      count: number;
      reviewCount: number;
      feedbackCount: number;
      bugCount: number;
      reason?: string;
    }
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
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const [reviewRes, feedbackRes, bugRes] = await Promise.all([
    supabase
      .from("review_submission_events")
      .select("id, kind, studio_name, slug, portfolio_title, created_at")
      .is("digested_at", null)
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", { ascending: true }),
    supabase
      .from("feedback")
      .select("message, role, contact_email, page_url, created_at")
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", { ascending: true }),
    supabase
      .from("bug_reports")
      .select("message, steps, page_url, status, created_at")
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", { ascending: true }),
  ]);

  if (reviewRes.error) {
    return { ok: false, error: reviewRes.error.message };
  }
  if (feedbackRes.error) {
    return { ok: false, error: feedbackRes.error.message };
  }
  if (bugRes.error) {
    return { ok: false, error: bugRes.error.message };
  }

  const events = (reviewRes.data ?? []) as (DigestEventRow & { id: string })[];
  const feedback = (feedbackRes.data ?? []) as DigestFeedbackRow[];
  const bugs = (bugRes.data ?? []) as DigestBugRow[];
  const total = events.length + feedback.length + bugs.length;

  if (total === 0) {
    return {
      ok: true,
      sent: false,
      count: 0,
      reviewCount: 0,
      feedbackCount: 0,
      bugCount: 0,
      reason: "no_activity_yesterday",
    };
  }

  const base = siteUrl();
  const rangeLabel = digestRangeLabel(start);
  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: emailFrom(),
    to,
    subject: digestSubject({
      rangeLabel,
      reviewCount: events.length,
      feedbackCount: feedback.length,
      bugCount: bugs.length,
    }),
    html: buildAdminReviewDigestHtml({
      reviewUrl: `${base}/admin/review`,
      feedbackUrl: `${base}/admin/feedback`,
      bugsUrl: `${base}/admin/bugs`,
      rangeLabel,
      events,
      feedback,
      bugs,
    }),
  });

  if (sendError) {
    return { ok: false, error: sendError.message };
  }

  if (events.length > 0) {
    const ids = events.map((e) => e.id);
    const { error: markError } = await supabase
      .from("review_submission_events")
      .update({ digested_at: new Date().toISOString() })
      .in("id", ids);

    if (markError) {
      console.error("[digest] failed to mark digested:", markError.message);
    }
  }

  return {
    ok: true,
    sent: true,
    count: total,
    reviewCount: events.length,
    feedbackCount: feedback.length,
    bugCount: bugs.length,
  };
}
