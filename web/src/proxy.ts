import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isSupabaseConfigured } from "@/lib/utils";

/**
 * 只負責更新登入 session。
 * 探索頁、工作室頁不擋登入（要讓 Threads 點進來的人和 Google 搜尋看得到作品）；
 * 發案者要「敲門」時才需要登入，見工作室頁與 actions/knock.ts。
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }
  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/auth/:path*",
    "/join",
  ],
};
