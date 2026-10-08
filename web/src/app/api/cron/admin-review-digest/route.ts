import { NextResponse } from "next/server";
import { runDay3OnboardingReminders } from "@/lib/email/runDay3OnboardingReminders";
import { runDailyAdminReviewDigest } from "@/lib/review-queue/runDailyAdminDigest";

export const dynamic = "force-dynamic";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [digest, day3] = await Promise.all([
    runDailyAdminReviewDigest(),
    runDay3OnboardingReminders(),
  ]);

  if (!digest.ok && !day3.ok) {
    return NextResponse.json(
      { error: digest.error, day3Error: day3.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: digest.ok && day3.ok,
    sent: digest.ok ? digest.sent : false,
    count: digest.ok ? digest.count : 0,
    reviewCount: digest.ok ? digest.reviewCount : 0,
    feedbackCount: digest.ok ? digest.feedbackCount : 0,
    bugCount: digest.ok ? digest.bugCount : 0,
    reason: digest.ok ? digest.reason : digest.error,
    day3: {
      ok: day3.ok,
      scanned: day3.scanned,
      sent: day3.sent,
      skipped: day3.skipped,
      failed: day3.failed,
      error: day3.error,
    },
  });
}
