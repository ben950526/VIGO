import { NextResponse } from "next/server";
import { publishNextApprovedPost } from "@/lib/threads/store";
import { taipeiDateString } from "@/lib/time/taipei";

export const dynamic = "force-dynamic";
// 建立容器後要等一下才能發布，加上第一則留言，留足時間
export const maxDuration = 60;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** 晚間那次只發吃藥小幫手，到這天（含）為止；之後晚間也照四個產品輪流（2026-11-18 經營者決定） */
const EVENING_MED_ONLY_UNTIL = "2026-12-11";

/** 台北 18 點以後執行的算晚間那次（Hobby 方案的 Cron 會在排定的那個小時內任一時間執行） */
function isEveningRun(now: Date): boolean {
  const hour = Number(
    now.toLocaleString("en-US", { timeZone: "Asia/Taipei", hour: "2-digit", hour12: false }),
  );
  return hour >= 18;
}

/**
 * Vercel Cron：每天台北 12 點、21 點各發一篇已核准的 Threads 文案（工作室帳號 @blazeatlas.studio）。
 * 12 點四個產品輪流；12/11 前 21 點只發吃藥小幫手，沒有就跳過。
 * 防封規則（每天最多 2 篇、間隔至少 6 小時、帶連結最多每 4 篇 1 篇）寫在 publishNextApprovedPost。
 */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const medOnly = isEveningRun(now) && taipeiDateString(now) <= EVENING_MED_ONLY_UNTIL;
  const result = await publishNextApprovedPost(medOnly ? { project: "med" } : {});
  if (!result.ok) {
    console.error("[cron/threads-post]", result.error);
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}
