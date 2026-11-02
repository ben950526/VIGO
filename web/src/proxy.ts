import { type NextRequest, NextResponse } from "next/server";
import { isClientLoginRequired, isGatedPublicPath } from "@/lib/auth/clientGate";
import { updateSession } from "@/lib/supabase/proxy";
import { isSupabaseConfigured } from "@/lib/utils";

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }
  const { response, hasSession } = await updateSession(request);

  const { pathname, search } = request.nextUrl;
  if (!hasSession && isClientLoginRequired() && isGatedPublicPath(pathname)) {
    const joinUrl = request.nextUrl.clone();
    joinUrl.pathname = "/join";
    joinUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(joinUrl);
  }

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
    "/explore",
    "/creator/:path*",
    "/join",
  ],
};
