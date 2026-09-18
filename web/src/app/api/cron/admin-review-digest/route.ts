import { NextResponse } from "next/server";
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

  const result = await runDailyAdminReviewDigest();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    count: result.count,
    reason: result.reason,
  });
}
