import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getThreadsStats } from "@/lib/threads/insights";

export const dynamic = "force-dynamic";

/** 只有管理員能看的成效 JSON（行銷排程用內建瀏覽器讀）；沒登入會被導到登入頁 */
export async function GET() {
  await requireAdmin();
  const stats = await getThreadsStats();
  return NextResponse.json(stats, { headers: { "Cache-Control": "no-store" } });
}
