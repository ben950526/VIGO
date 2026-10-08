import { NextResponse } from "next/server";
import { runOnboardingNudges } from "@/lib/email/runOnboardingNudges";
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

  const [digest, nudges] = await Promise.all([
    runDailyAdminReviewDigest(),
    runOnboardingNudges(),
  ]);

  if (!digest.ok && !nudges.ok) {
    return NextResponse.json(
      { error: digest.error, nudgeError: nudges.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: digest.ok && nudges.ok,
    sent: digest.ok ? digest.sent : false,
    count: digest.ok ? digest.count : 0,
    reviewCount: digest.ok ? digest.reviewCount : 0,
    feedbackCount: digest.ok ? digest.feedbackCount : 0,
    bugCount: digest.ok ? digest.bugCount : 0,
    reason: digest.ok ? digest.reason : digest.error,
    onboardingNudges: {
      ok: nudges.ok,
      scanned: nudges.scanned,
      sent: nudges.sent,
      skipped: nudges.skipped,
      failed: nudges.failed,
      error: nudges.error,
    },
  });
}
