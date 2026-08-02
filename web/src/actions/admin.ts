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
import { requireAdmin } from "@/lib/auth/admin";
import {
  loadCreatorApprovalSnapshot,
  notifyCreatorApprovedFromPending,
  notifyCreatorRejectedFromPending,
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
