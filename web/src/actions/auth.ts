"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, createCreatorSlug } from "@/lib/utils";

export async function signUp(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { error: "請先設定 Supabase 環境變數（見 .env.example）" };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const realName = String(formData.get("real_name") ?? "").trim();
  const studioName = String(formData.get("studio_name") ?? "").trim();

  if (!email || !password || !realName || !studioName) {
    return { error: "請填寫所有必填欄位" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { real_name: realName, role: "creator" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "註冊失敗，請稍後再試" };

  const slug = createCreatorSlug(studioName, data.user.id);

  const { error: profileError } = await supabase.from("creator_profiles").insert({
    user_id: data.user.id,
    slug,
    studio_name: studioName,
    contact_email: email,
    verification_status: "pending",
  });

  if (profileError) return { error: profileError.message };

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { error: "請先設定 Supabase 環境變數（見 .env.example）" };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
