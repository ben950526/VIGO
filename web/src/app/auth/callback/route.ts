import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/clientGate";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * 發案者用 Google 登入（as=client）：新帳號預設 role 是 creator（DB trigger），
 * 沒有工作室的就改成 client，並記下同意收提醒信的時間。已有工作室的接案者、管理員不動。
 */
async function markAsClient(userId: string) {
  const service = createServiceClient();
  if (!service) return;

  const [{ data: profile }, { data: studio }] = await Promise.all([
    service.from("profiles").select("role").eq("id", userId).maybeSingle(),
    service.from("creator_profiles").select("id").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile || studio || profile.role === "admin") return;

  const now = new Date().toISOString();
  const { error } = await service
    .from("profiles")
    .update({ role: "client", client_marketing_consent_at: now })
    .eq("id", userId)
    .is("client_marketing_consent_at", null);

  // 還沒跑 035 時沒有同意時間欄位，至少把 role 改對
  if (error) {
    await service.from("profiles").update({ role: "client" }).eq("id", userId);
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const asClient = searchParams.get("as") === "client";
  const next = safeNextPath(searchParams.get("next"), asClient ? "/explore" : "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (asClient && data.user) await markAsClient(data.user.id);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(asClient ? `${origin}/join?error=auth` : `${origin}/login?error=auth`);
}
