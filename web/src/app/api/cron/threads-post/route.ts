import { NextResponse } from "next/server";
import { publishNextApprovedPost } from "@/lib/threads/store";

export const dynamic = "force-dynamic";
// 建立容器後要等一下才能發布，加上第一則留言，留足時間
export const maxDuration = 60;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Vercel Cron：每天台北 12 點發一篇已核准的 Threads 文案（工作室帳號 @blazeatlas.studio）。
 * 防封規則（每天最多 1 篇、帶連結最多每 4 篇 1 篇）寫在 publishNextApprovedPost。
 */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await publishNextApprovedPost();
  if (!result.ok) {
    console.error("[cron/threads-post]", result.error);
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}
