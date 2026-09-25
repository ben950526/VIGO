"use server";

import { revalidatePath } from "next/cache";
import { getAuthUserId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import type { PromoSharePlatform } from "@/lib/data/promo-share";

const PLATFORMS: PromoSharePlatform[] = ["threads", "facebook", "instagram", "tiktok", "other"];

export type PromoShareFormState = { error?: string; ok?: boolean; message?: string };

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function submitPromoShareProof(
  _prev: PromoShareFormState | null,
  formData: FormData,
): Promise<PromoShareFormState> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "請先登入" };

  const platform = String(formData.get("platform") ?? "") as PromoSharePlatform;
  const postUrl = normalizeUrl(String(formData.get("post_url") ?? ""));

  if (!PLATFORMS.includes(platform)) {
    return { error: "請選擇平台" };
  }
  if (!postUrl) {
    return { error: "請填寫有效的公開貼文連結" };
  }

  const supabase = await createClient();

  const { data: approved } = await supabase
    .from("promo_share_submissions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .maybeSingle();

  if (approved) {
    return { error: "您已領取過社群宣傳獎勵（每人終身一次）" };
  }

  const { data: pending } = await supabase
    .from("promo_share_submissions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (pending) {
    return { error: "您已有待審核的宣傳證明，請等待審核結果" };
  }

  const { error } = await supabase.from("promo_share_submissions").insert({
    user_id: userId,
    platform,
    post_url: postUrl,
  });

  if (error) {
    return { error: error.message.includes("promo_share") ? "資料庫尚未更新，請執行 migration 020" : error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true, message: "已送出，審核通過後將發放折抵點" };
}

export async function approvePromoShareSubmission(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_approve_promo_share", {
    p_submission_id: id,
  });

  if (error) throw new Error(error.message);
  const payload = data as { ok?: boolean; reason?: string } | null;
  if (!payload?.ok) {
    throw new Error(payload?.reason ?? "審核失敗");
  }

  revalidatePath("/admin/review");
  revalidatePath("/dashboard");
}

export async function rejectPromoShareSubmission(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("admin_note") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_reject_promo_share", {
    p_submission_id: id,
    p_note: note || null,
  });

  if (error) throw new Error(error.message);
  const payload = data as { ok?: boolean; reason?: string } | null;
  if (!payload?.ok) {
    throw new Error(payload?.reason ?? "拒絕失敗");
  }

  revalidatePath("/admin/review");
  revalidatePath("/dashboard");
}
