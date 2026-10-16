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
import {
  avatarObjectPath,
  avatarUploadErrorMessage,
  isAvatarExt,
  validateAvatarFile,
} from "@/lib/avatar-file";
import { formatSchemaError } from "@/lib/db-schema";
import { isSupabaseConfigured } from "@/lib/utils";
import { collectTagsFromForm } from "@/lib/tags";
import { notifyAdminReviewPending } from "@/lib/email/notifyAdminReviewPending";

type AuthedClient = Awaited<ReturnType<typeof createClient>>;

async function saveAvatarUrl(
  supabase: AuthedClient,
  profileId: string,
  publicUrl: string,
): Promise<string | null> {
  const { error } = await supabase
    .from("creator_profiles")
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", profileId);
  return error ? error.message : null;
}

async function uploadCreatorAvatar(
  supabase: AuthedClient,
  userId: string,
  profileId: string,
  avatarFile: File,
): Promise<string | null> {
  const checked = validateAvatarFile(avatarFile);
  if (!checked.ok) return checked.error;

  const path = avatarObjectPath(userId, checked.ext);
  const buffer = Buffer.from(await avatarFile.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, { contentType: checked.contentType, upsert: true });

  if (uploadError) return avatarUploadErrorMessage(uploadError.message);

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  return saveAvatarUrl(supabase, profileId, urlData.publicUrl);
}

async function publicAvatarExists(publicUrl: string): Promise<boolean> {
  try {
    const response = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

async function attachUploadedAvatar(
  supabase: AuthedClient,
  userId: string,
  profileId: string,
  ext: string,
): Promise<string | null> {
  if (!isAvatarExt(ext)) return "請上傳 JPG、PNG、WebP 或 GIF";

  const path = avatarObjectPath(userId, ext);
  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const { data: files, error } = await supabase.storage.from("avatars").list(userId, { limit: 20 });
  const listed = !error && files?.some((file) => file.name === `avatar.${ext}`);
  const exists = listed || (await publicAvatarExists(urlData.publicUrl));
  if (!exists) return "照片沒有上傳成功，請再選一次後儲存";

  return saveAvatarUrl(supabase, profileId, urlData.publicUrl);
}

export async function updateCreatorProfile(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { error: "請先設定 Supabase" };
  }

  const supabase = await createClient();
  const userId = await getAuthUserId();
  if (!userId) return { error: "請先登入" };

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("id, studio_name, slug, verification_status")
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

  let priceListRaw: unknown = [];
  try {
    priceListRaw = JSON.parse(String(formData.get("price_list_json") ?? "[]"));
  } catch {
    priceListRaw = [];
  }
  const priceList = parsePriceList(priceListRaw);

  const websiteRaw = String(formData.get("website_url") ?? "").trim();
  const websiteUrl = websiteRaw
    ? /^https?:\/\//i.test(websiteRaw)
      ? websiteRaw
      : `https://${websiteRaw}`
    : null;

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
      platforms,
      client_types: clientTypes,
      languages,
      website_url: websiteUrl,
      price_list: priceList as unknown as Json,
      ...(profile.verification_status === "rejected" || profile.verification_status === "draft"
        ? { verification_status: "pending" }
        : {}),
    })
    .eq("id", profile.id);

  if (error) {
    return { error: formatSchemaError(error.message) ?? error.message };
  }

  const avatarFile = formData.get("avatar");
  const avatarExt = String(formData.get("avatar_ext") ?? "").trim().toLowerCase();
  let avatarError: string | null = null;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    avatarError = await uploadCreatorAvatar(supabase, userId, profile.id, avatarFile);
  } else if (avatarExt) {
    avatarError = await attachUploadedAvatar(supabase, userId, profile.id, avatarExt);
  }
  if (avatarError) {
    return { error: `文字資料已儲存，但照片沒放上去：${avatarError}` };
  }

  if (profile.verification_status === "rejected" || profile.verification_status === "draft") {
    void notifyAdminReviewPending({
      kind: "profile_update",
      studioName: String(formData.get("studio_name") ?? profile.studio_name).trim(),
      slug: profile.slug,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/studio");
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
    .select("id, subscription_tier, studio_name, slug")
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
  if (!parsed) {
    return {
      error: "請輸入有效的 YouTube / Vimeo / Instagram 連結",
    };
  }

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

  const portfolioTitle = String(formData.get("title") ?? "").trim();
  void notifyAdminReviewPending({
    kind: "new_portfolio",
    studioName: profile.studio_name,
    slug: profile.slug,
    portfolioTitle,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/studio");
  return { success: true };
}

export async function updatePortfolioItem(formData: FormData) {
  if (!isSupabaseConfigured()) return { error: "請先設定 Supabase" };

  const itemId = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const embedUrl = String(formData.get("embed_url") ?? "").trim();
  if (!itemId || !title || !embedUrl) return { error: "請填寫標題與作品連結" };

  const parsed = parseEmbedUrl(embedUrl);
  if (!parsed) {
    return { error: "請輸入有效的 YouTube / Vimeo / Instagram 連結" };
  }

  const supabase = await createClient();
  const userId = await getAuthUserId();
  if (!userId) return { error: "請先登入" };

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("id, studio_name, slug")
    .eq("user_id", userId)
    .single();
  if (!profile) return { error: "找不到工作室" };

  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id, embed_url, status")
    .eq("id", itemId)
    .eq("creator_id", profile.id)
    .maybeSingle();
  if (!item) return { error: "找不到這則作品" };

  const urlChanged = item.embed_url.trim() !== embedUrl;
  const { error } = await supabase
    .from("portfolio_items")
    .update({
      title,
      description,
      embed_url: embedUrl,
      embed_type: parsed.type,
      thumbnail_url: parsed.thumbnailUrl,
      ...(urlChanged ? { status: "pending" as const } : {}),
    })
    .eq("id", itemId)
    .eq("creator_id", profile.id);

  if (error) return { error: error.message };

  if (urlChanged) {
    void notifyAdminReviewPending({
      kind: "new_portfolio",
      studioName: profile.studio_name,
      slug: profile.slug,
      portfolioTitle: title,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/studio");
  revalidatePath(`/creator/${profile.slug}`);
  revalidateCreatorList();
  return { success: true, pendingAgain: urlChanged };
}

export async function deletePortfolioItem(formData: FormData) {
  if (!isSupabaseConfigured()) return { error: "請先設定 Supabase" };

  const itemId = String(formData.get("id") ?? "").trim();
  if (!itemId) return { error: "缺少作品 ID" };

  const supabase = await createClient();
  const userId = await getAuthUserId();
  if (!userId) return { error: "請先登入" };

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("id, slug")
    .eq("user_id", userId)
    .single();
  if (!profile) return { error: "找不到工作室" };

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId)
    .eq("creator_id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/studio");
  revalidatePath(`/creator/${profile.slug}`);
  revalidateCreatorList();
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
  revalidatePath("/dashboard/studio");
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
