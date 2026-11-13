import { NextResponse } from "next/server";
import { runWeeklyMilestoneCheck } from "@/lib/milestones/runWeeklyMilestoneCheck";

export const dynamic = "force-dynamic";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** 每週一早上：收費門檻與停損倒數，寄給經營者 */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runWeeklyMilestoneCheck();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
