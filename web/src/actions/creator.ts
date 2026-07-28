"use server";

import { revalidatePath } from "next/cache";
import { revalidateCreatorList } from "@/lib/cache/revalidate";
import { getAuthUserId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseEmbedUrl } from "@/lib/embed";
import { parsePriceList } from "@/lib/price-list";
import type { Json } from "@/types/supabase";
import {
  CLIENT_TYPES,
  FREE_PORTFOLIO_LIMIT,
  LANGUAGES,
  PLATFORMS,
  REGIONS,
  REVISION_OPTIONS,
  SERVICE_TYPES,
  STYLE_TAGS,
  TEAM_SIZES,
} from "@/lib/constants";
import { formatSchemaError } from "@/lib/db-schema";
import { isSupabaseConfigured } from "@/lib/utils";
import { collectTagsFromForm } from "@/lib/tags";

export async function updateCreatorProfile(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { error: "請先設定 Supabase" };
  }

  const supabase = await createClient();
  const userId = await getAuthUserId();
  if (!userId) return { error: "請先登入" };

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) return { error: "找不到創作者資料" };

  const styleTags = collectTagsFromForm(formData, STYLE_TAGS, "tag_", "style_tags_custom");
  const serviceTypes = collectTagsFromForm(
    formData,
    SERVICE_TYPES,
    "service_",
    "service_types_custom",
  );
  const platforms = collectTagsFromForm(formData, PLATFORMS, "platform_", "platforms_custom");
  const clientTypes = collectTagsFromForm(
    formData,
    CLIENT_TYPES,
    "client_",
    "client_types_custom",
  );
  const languages = collectTagsFromForm(formData, LANGUAGES, "lang_", "languages_custom");

  const region = String(formData.get("region") ?? "");
  if (region && !REGIONS.includes(region as (typeof REGIONS)[number])) {
    return { error: "無效的地區" };
  }

  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(avatarFile.type)) {
      return { error: "請上傳 JPG、PNG 或 WebP 圖片" };
    }
    if (avatarFile.size > 5 * 1024 * 1024) {
      return { error: "圖片需小於 5MB" };
    }

    const ext =
      avatarFile.type === "image/jpeg"
        ? "jpg"
        : avatarFile.type.replace("image/", "");
    const path = `${userId}/avatar.${ext}`;
    const buffer = Buffer.from(await avatarFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, { contentType: avatarFile.type, upsert: true });

    if (uploadError) {
      if (uploadError.message.includes("Bucket not found")) {
        return {
          error:
            "儲存空間尚未建立。請到 Supabase → SQL Editor 執行 supabase/migrations/003_avatar_storage.sql，或到 Storage 手動新增名為 avatars 的 Public bucket。",
        };
      }
      return { error: `上傳失敗：${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
  }

  const priceList = parsePriceList(
    JSON.parse(String(formData.get("price_list_json") ?? "[]")),
  );

  const { error } = await supabase
    .from("creator_profiles")
    .update({
      studio_name: String(formData.get("studio_name") ?? "").trim(),
      bio: String(formData.get("bio") ?? "").trim() || null,
      region: region || null,
      style_tags: styleTags,
      service_types: serviceTypes,
      contact_email: String(formData.get("contact_email") ?? "").trim() || null,
      line_id: String(formData.get("line_id") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      show_email: formData.get("show_email") === "on",
      show_line: formData.get("show_line") === "on",
      show_phone: formData.get("show_phone") === "on",
      revision_policy: String(formData.get("revision_policy") ?? "").trim() || null,
      response_time: String(formData.get("response_time") ?? "").trim() || null,
      team_size: String(formData.get("team_size") ?? "").trim() || null,
      platforms,
      client_types: clientTypes,
      languages,
      typical_scope: String(formData.get("typical_scope") ?? "").trim() || null,
      website_url: String(formData.get("website_url") ?? "").trim() || null,
      price_list: priceList as unknown as Json,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      verification_status: "pending",
    })
    .eq("id", profile.id);

  if (error) {
    return { error: formatSchemaError(error.message) ?? error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidateCreatorList();
  return { success: true };
}

export async function addPortfolioItem(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { error: "請先設定 Supabase" };
  }

  const supabase = await createClient();
  const userId = await getAuthUserId();
  if (!userId) return { error: "請先登入" };

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("id, subscription_tier")
    .eq("user_id", userId)
    .single();

  if (!profile) return { error: "請先完成工作室資料" };

  const { count } = await supabase
    .from("portfolio_items")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", profile.id);

  const limit =
    profile.subscription_tier === "free" ? FREE_PORTFOLIO_LIMIT : 999;
  if ((count ?? 0) >= limit) {
    return { error: `免費方案最多 ${FREE_PORTFOLIO_LIMIT} 個作品` };
  }

  const embedUrl = String(formData.get("embed_url") ?? "").trim();
  const parsed = parseEmbedUrl(embedUrl);
  if (!parsed) return { error: "請輸入有效的 YouTube / Vimeo / Instagram 連結" };

  const { error } = await supabase.from("portfolio_items").insert({
    creator_id: profile.id,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    embed_url: embedUrl,
    embed_type: parsed.type,
    thumbnail_url: parsed.thumbnailUrl,
    style_tags: collectTagsFromForm(formData, STYLE_TAGS, "tag_", "style_tags_custom"),
    status: "pending",
    sort_order: count ?? 0,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function setFeaturedPortfolioItem(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const itemId = String(formData.get("id") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  const userId = await getAuthUserId();
  if (!userId) return;

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("id, slug")
    .eq("user_id", userId)
    .single();

  if (!profile) return;

  const { data: items } = await supabase
    .from("portfolio_items")
    .select("id, sort_order")
    .eq("creator_id", profile.id)
    .order("sort_order", { ascending: true });

  if (!items?.length) return;

  const target = items.find((item) => item.id === itemId);
  if (!target) return;

  const reordered = [target, ...items.filter((item) => item.id !== itemId)];

  await Promise.all(
    reordered
      .map((item, index) => ({ id: item.id, index, prev: item.sort_order }))
      .filter(({ index, prev }) => index !== prev)
      .map(({ id, index }) =>
        supabase.from("portfolio_items").update({ sort_order: index }).eq("id", id),
      ),
  );

  revalidatePath("/dashboard");
  revalidatePath(`/creator/${profile.slug}`);
}

export async function setCreatorListing(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { error: "請先設定 Supabase" };
  }

  const listed = formData.get("listed") === "true";
  const supabase = await createClient();
  const userId = await getAuthUserId();
  if (!userId) return { error: "請先登入" };

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("id, slug, verification_status")
    .eq("user_id", userId)
    .single();

  if (!profile) return { error: "找不到創作者資料" };
  if (profile.verification_status !== "approved") {
    return { error: "工作室尚未通過審核，無法上架或下架" };
  }

  const { error } = await supabase
    .from("creator_profiles")
    .update({
      is_listed: listed,
      ...(listed ? {} : { featured: false }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) {
    if (error.message.includes("is_listed") || error.message.includes("schema cache")) {
      return {
        error:
          "下架功能尚未啟用。請到 Supabase SQL Editor 執行 supabase/migrations/012_is_listed.sql。",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidateCreatorList();
  revalidatePath(`/creator/${profile.slug}`);

  return { success: true };
}
