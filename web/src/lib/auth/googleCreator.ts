import type { SupabaseClient, User } from "@supabase/supabase-js";
import { afterCreatorSignup } from "@/actions/signup-complete";
import { TERMS_VERSION } from "@/lib/legal";
import { createServiceClient } from "@/lib/supabase/service";
import { createCreatorSlug } from "@/lib/utils";
import type { Database } from "@/types/supabase";

/**
 * 接案者用 Google 註冊（as=creator）：沒有工作室就建一個，流程比照密碼註冊
 * （creator_profiles 待審、推薦碼給點、歡迎信＋審核摘要）。已有工作室就什麼都不做。
 * 回傳 "created"／"existing"／"failed"。
 */
export async function ensureGoogleCreatorStudio(params: {
  supabase: SupabaseClient<Database>;
  user: User;
  referrerRef: string | null;
}): Promise<"created" | "existing" | "failed"> {
  const { supabase, user } = params;

  const { data: existing } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return "existing";

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = (user.email ?? "").trim();
  const googleName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    email.split("@")[0] ||
    "我的工作室";
  const studioName = googleName.slice(0, 40);
  const slug = createCreatorSlug(studioName, user.id);

  const { error: insertError } = await supabase.from("creator_profiles").insert({
    user_id: user.id,
    slug,
    studio_name: studioName,
    contact_email: email,
    verification_status: "pending",
  });
  if (insertError && insertError.code !== "23505") {
    console.error("[google-creator] 建立工作室失敗", insertError.message);
    return "failed";
  }

  // 同意條款時間記在 auth 使用者資料（跟密碼註冊放同一個地方）
  await supabase.auth
    .updateUser({
      data: {
        role: "creator",
        real_name: googleName,
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
      },
    })
    .catch(() => null);

  // 若之前用 /join 以發案者身分登入過，角色改回接案者（一般 session 不能改 role，見 034）
  const service = createServiceClient();
  if (service) {
    await service
      .from("profiles")
      .update({ role: "creator", real_name: googleName })
      .eq("id", user.id)
      .neq("role", "admin");
  }

  const ref = params.referrerRef?.trim();
  if (ref) {
    await supabase
      .rpc("award_referral_for_signup", { p_referred_user_id: user.id, p_referrer_slug: ref })
      .then(
        () => null,
        () => null,
      );
  }

  await afterCreatorSignup({ email, studioName, slug }).catch(() => null);
  return "created";
}
