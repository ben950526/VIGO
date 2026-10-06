"use server";

import { revalidatePath } from "next/cache";
import {
  revalidateAdminReviewOnly,
  revalidateAfterPublicCreatorChange,
  revalidateCreatorList,
} from "@/lib/cache/revalidate";
import { demoPortfolioBySlug } from "@/lib/demo-portfolio-data";
import { demoPatchToDbRow, demoStudioPatches } from "@/lib/demo-studio-data";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { sendAccountPurgedEmail } from "@/lib/email/sendAccountPurgedEmail";
import {
  loadCreatorApprovalSnapshot,
  loadCreatorReviewSnapshot,
  notifyCreatorApprovedFromPending,
  notifyCreatorRejectedFromPending,
  sendApprovalEmailForCreator,
} from "@/lib/email/notifyCreatorApproved";

export async function seedDemoAccounts(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("seed_demo_accounts");

  if (error) {
    if (
      error.message.includes("seed_demo_accounts") ||
      error.message.includes("schema cache")
    ) {
      return {
        ok: false,
        message:
          "請先到 Supabase SQL Editor 執行 supabase/migrations/013_is_demo.sql，再從審核管理重試。",
      };
    }
    return { ok: false, message: error.message };
  }

  revalidateCreatorList();
  revalidatePath("/explore");
  for (const slug of demoPortfolioBySlug.map((g) => g.slug)) {
    revalidatePath(`/creator/${slug}`);
  }

  return { ok: true, message: String(data ?? "已建立示範帳號") };
}

export async function seedDemoPortfolioData(): Promise<{
  ok: boolean;
  message: string;
  inserted: number;
}> {
  await requireAdmin();
  const supabase = await createClient();

  let inserted = 0;
  const errors: string[] = [];

  for (const group of demoPortfolioBySlug) {
    const { data: creator, error: creatorError } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("slug", group.slug)
      .single();

    if (creatorError || !creator) {
      errors.push(`${group.slug}: 找不到創作者`);
      continue;
    }

    const { data: existing } = await supabase
      .from("portfolio_items")
      .select("title")
      .eq("creator_id", creator.id);

    const existingTitles = new Set((existing ?? []).map((row) => row.title));

    for (const item of group.items) {
      if (existingTitles.has(item.title)) continue;

      const { error } = await supabase.from("portfolio_items").insert({
        creator_id: creator.id,
        title: item.title,
        description: item.description,
        embed_url: item.embed_url,
        embed_type: item.embed_type,
        thumbnail_url: item.thumbnail_url,
        style_tags: item.style_tags,
        sort_order: item.sort_order,
        status: "approved",
      });

      if (error) {
        errors.push(`${group.slug}/${item.title}: ${error.message}`);
      } else {
        inserted++;
      }
    }
  }

  revalidateCreatorList();
  revalidatePath("/admin/review");
  for (const group of demoPortfolioBySlug) {
    revalidatePath(`/creator/${group.slug}`);
  }

  if (errors.length > 0) {
    return {
      ok: false,
      inserted,
      message: `已新增 ${inserted} 支作品，失敗：${errors.join("；")}`,
    };
  }

  return {
    ok: true,
    inserted,
    message: `已新增 ${inserted} 支示範作品`,
  };
}

export async function updateDemoStudioData(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const supabase = await createClient();

  let updated = 0;
  const errors: string[] = [];

  for (const patch of demoStudioPatches) {
    const row = demoPatchToDbRow(patch);
    let { error } = await supabase
      .from("creator_profiles")
      .update(row)
      .eq("slug", patch.slug);

    if (error?.message.includes("price_list") || error?.message.includes("is_demo")) {
      const { price_list: _p, is_demo: _d, ...fallback } = row;
      ({ error } = await supabase
        .from("creator_profiles")
        .update(fallback)
        .eq("slug", patch.slug));
    }

    if (error) {
      errors.push(`${patch.slug}: ${error.message}`);
    } else {
      updated++;
    }
  }

  revalidateCreatorList();
  revalidatePath("/admin/review");
  for (const patch of demoStudioPatches) {
    revalidatePath(`/creator/${patch.slug}`);
  }

  if (errors.length > 0) {
    return {
      ok: false,
      message: `已更新 ${updated} 個，失敗：${errors.join("；")}`,
    };
  }

  return { ok: true, message: `已更新 ${updated} 個示範工作室資料` };
}

export async function seedAllDemoData(): Promise<{ ok: boolean; message: string }> {
  const accounts = await seedDemoAccounts();
  const studio = await updateDemoStudioData();
  const portfolio = await seedDemoPortfolioData();

  const ok = accounts.ok && studio.ok && portfolio.ok;
  return {
    ok,
    message: [accounts.message, studio.message, portfolio.message].join("；"),
  };
}

export async function removeAllDemoAccounts(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("remove_demo_accounts");

  if (error) {
    if (
      error.message.includes("remove_demo_accounts") ||
      error.message.includes("schema cache")
    ) {
      return {
        ok: false,
        message:
          "請先到 Supabase SQL Editor 執行 supabase/migrations/011_remove_demo_accounts.sql，再從審核管理重試。",
      };
    }
    return { ok: false, message: error.message };
  }

  revalidateCreatorList();
  revalidatePath("/admin/review");

  return { ok: true, message: String(data ?? "已撤除所有假帳號") };
}

export async function approveCreator(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const before = await loadCreatorApprovalSnapshot(supabase, id);

  await supabase
    .from("creator_profiles")
    .update({ verification_status: "approved", is_listed: true })
    .eq("id", id);

  await notifyCreatorApprovedFromPending(before);
  revalidateAfterPublicCreatorChange();
}

export async function rejectCreator(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const before = await loadCreatorApprovalSnapshot(supabase, id);

  await supabase
    .from("creator_profiles")
    .update({ verification_status: "rejected" })
    .eq("id", id);

  await notifyCreatorRejectedFromPending(before);
  revalidateAdminReviewOnly();
}

export async function approvePortfolioItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("portfolio_items")
    .update({ status: "approved" })
    .eq("id", id);

  revalidateAfterPublicCreatorChange();
}

export async function rejectPortfolioItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("portfolio_items")
    .update({ status: "rejected" })
    .eq("id", id);

  revalidateAdminReviewOnly();
}

export async function approveCreatorAndWorks(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const before = await loadCreatorApprovalSnapshot(supabase, id);

  await Promise.all([
    supabase
      .from("creator_profiles")
      .update({ verification_status: "approved", is_listed: true })
      .eq("id", id),
    supabase
      .from("portfolio_items")
      .update({ status: "approved" })
      .eq("creator_id", id)
      .eq("status", "pending"),
  ]);

  await notifyCreatorApprovedFromPending(before);
  revalidateAfterPublicCreatorChange();
}

export async function adminSetCreatorListing(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "") || undefined;
  const listed = formData.get("listed") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("creator_profiles").update({ is_listed: listed }).eq("id", id);

  revalidateAfterPublicCreatorChange(slug);
}

export async function adminSetPortfolioListing(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "") || undefined;
  const listed = formData.get("listed") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("portfolio_items")
    .update({ status: listed ? "approved" : "rejected" })
    .eq("id", id);

  revalidateAfterPublicCreatorChange(slug);
}

export type ResendApprovalState = { error?: string; ok?: boolean; message?: string };

export async function resendCreatorApprovalEmail(
  _prev: ResendApprovalState | null,
  formData: FormData,
): Promise<ResendApprovalState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "找不到工作室" };

  const supabase = await createClient();
  const snapshot = await loadCreatorReviewSnapshot(supabase, id);
  if (!snapshot) return { error: "找不到工作室" };

  const result = await sendApprovalEmailForCreator(snapshot);
  if (!result.ok) return { error: result.error };
  return { ok: true, message: "已補寄通過信，請查收件匣與垃圾郵件" };
}

export type PurgeCreatorState = { error?: string; ok?: boolean; message?: string };

/**
 * 完整註銷：刪除 Auth 帳號（Email 可再註冊）。
 * 僅限示範帳號以外，且須為「已下架」或「尚未通過審核／已退件」。
 */
export async function purgeCreatorAccount(
  _prev: PurgeCreatorState | null,
  formData: FormData,
): Promise<PurgeCreatorState> {
  const adminProfile = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const confirmSlug = String(formData.get("confirm_slug") ?? "").trim().toLowerCase();
  if (!id) return { error: "找不到工作室" };

  const service = createServiceClient();
  if (!service) {
    return { error: "缺少 SUPABASE_SERVICE_ROLE_KEY，無法刪除登入帳號" };
  }

  const { data: creator, error: loadError } = await service
    .from("creator_profiles")
    .select("id, user_id, slug, studio_name, contact_email, is_listed, is_demo, verification_status")
    .eq("id", id)
    .maybeSingle();

  if (loadError) return { error: loadError.message };
  if (!creator) return { error: "找不到工作室" };

  if (confirmSlug !== creator.slug.toLowerCase()) {
    return { error: "請完整輸入 slug 以確認註銷（須與畫面上的 slug 完全相同）" };
  }

  if (creator.is_demo) {
    return { error: "示範帳號請用「撤除假帳號」，不要個別註銷" };
  }

  if (creator.user_id === adminProfile.id) {
    return { error: "不能註銷目前登入的管理員帳號" };
  }

  const approvedAndListed =
    creator.verification_status === "approved" && creator.is_listed !== false;
  if (approvedAndListed) {
    return { error: "請先下架工作室，才能完整註銷帳號" };
  }

  const { data: roleRow } = await service
    .from("profiles")
    .select("role, email")
    .eq("id", creator.user_id)
    .maybeSingle();

  if (roleRow?.role === "admin") {
    return { error: "不能註銷管理員帳號" };
  }

  const notifyTo = (roleRow?.email?.trim() || creator.contact_email?.trim() || "").toLowerCase();
  const reason = String(formData.get("purge_reason") ?? "").trim() || null;
  if (notifyTo) {
    try {
      await sendAccountPurgedEmail({
        to: notifyTo,
        studioName: creator.studio_name,
        reason,
      });
    } catch (err) {
      console.error("[email] purge notify:", err);
    }
  } else {
    console.warn("[email] no email for purge:", creator.studio_name);
  }

  const folder = creator.user_id;
  const { data: avatarFiles } = await service.storage.from("avatars").list(folder);
  if (avatarFiles && avatarFiles.length > 0) {
    await service.storage
      .from("avatars")
      .remove(avatarFiles.map((file) => `${folder}/${file.name}`));
  }

  const { error: deleteError } = await service.auth.admin.deleteUser(creator.user_id);
  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidateAfterPublicCreatorChange(creator.slug);
  revalidatePath("/admin/review");

  return {
    ok: true,
    message: `已註銷「${creator.studio_name}」，Email 可重新註冊`,
  };
}
