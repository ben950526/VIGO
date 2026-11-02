import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/clientGate";
import { ensureGoogleCreatorStudio } from "@/lib/auth/googleCreator";
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

/**
 * as=client：發案者 Google 登入（/join）
 * as=creator：接案者 Google 註冊（/register），沒有工作室就建一個
 * as=creator_login：接案者 Google 登入（/login），沒有工作室就導去註冊頁
 * 沒有 as：密碼註冊確認信、忘記密碼等舊流程
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const as = searchParams.get("as");
  const asClient = as === "client";
  const next = safeNextPath(searchParams.get("next"), asClient ? "/explore" : "/dashboard");
  const failUrl = asClient
    ? `${origin}/join?error=auth`
    : as === "creator"
      ? `${origin}/register?error=google`
      : `${origin}/login?error=auth`;

  if (!code) return NextResponse.redirect(failUrl);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(failUrl);

  if (asClient) {
    await markAsClient(data.user.id);
  } else if (as === "creator") {
    const result = await ensureGoogleCreatorStudio({
      supabase,
      user: data.user,
      referrerRef: searchParams.get("ref"),
    });
    if (result === "failed") return NextResponse.redirect(`${origin}/register?error=studio`);
    if (result === "created") return NextResponse.redirect(`${origin}/dashboard/studio?welcome=1`);
  } else if (as === "creator_login") {
    const { data: studio } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!studio) return NextResponse.redirect(`${origin}/register?need_studio=1`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
