"use server";

import {
  extractKnockUnlock,
  KNOCK_UNLOCK_SELECT,
  type CreatorKnockUnlock,
} from "@/lib/creator/sensitive";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/utils";

export type KnockResult =
  | { success: true; unlock: CreatorKnockUnlock }
  | { error: string };

const DEMO_UNLOCK: CreatorKnockUnlock = {
  bio: "示範工作室自介",
  style_tags: ["活潑", "知識型"],
  service_types: ["短影音剪輯"],
  portfolio_items: [],
  contact_email: "demo@example.com",
  line_id: "@demo",
  phone: null,
  show_email: true,
  show_line: true,
  show_phone: false,
  price_min: 3000,
  price_max: 15000,
  price_list: [],
  revision_policy: "含 2 次修改",
  response_time: "1～2 個工作天",
  team_size: "個人工作室",
  platforms: ["Instagram"],
  client_types: ["電商"],
  languages: ["中文"],
  typical_scope: null,
  website_url: null,
};

async function fetchKnockUnlock(creatorId: string): Promise<CreatorKnockUnlock | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(`id, verification_status, is_listed, is_demo, ${KNOCK_UNLOCK_SELECT}`)
    .eq("id", creatorId)
    .eq("verification_status", "approved")
    .eq("is_listed", true)
    .eq("is_demo", false)
    .maybeSingle();

  if (error || !data) return null;
  return extractKnockUnlock(data as Record<string, unknown>);
}

export async function knockCreator(formData: FormData): Promise<KnockResult> {
  const creatorId = String(formData.get("creator_id") ?? "").trim();
  const visitorKey = String(formData.get("visitor_key") ?? "").trim();
  const pageUrl = String(formData.get("page_url") ?? "").trim() || null;
  const userAgent = String(formData.get("user_agent") ?? "").trim() || null;

  if (!creatorId || !visitorKey) {
    return { error: "缺少必要資訊，請重新整理頁面再試" };
  }

  if (!isSupabaseConfigured()) {
    return { success: true, unlock: DEMO_UNLOCK };
  }

  const unlock = await fetchKnockUnlock(creatorId);
  if (!unlock) {
    return { error: "此工作室目前無法敲門，可能已下架或為示範帳號" };
  }

  const supabase = createPublicClient();
  const { error } = await supabase.from("knocks").insert({
    creator_id: creatorId,
    visitor_key: visitorKey,
    page_url: pageUrl,
    user_agent: userAgent,
  });

  if (error) {
    if (error.message.includes("knocks") || error.message.includes("schema cache")) {
      return {
        error:
          "敲門功能尚未啟用。請到 Supabase SQL Editor 執行 supabase/migrations/014_knocks.sql 後再試。",
      };
    }
    return { error: error.message };
  }

  return { success: true, unlock };
}

/** 已敲過門的訪客重新載入時取資料，不新增敲門紀錄 */
export async function getUnlockedStudio(creatorId: string): Promise<KnockResult> {
  if (!creatorId) return { error: "缺少工作室 ID" };

  if (!isSupabaseConfigured()) {
    return { success: true, unlock: DEMO_UNLOCK };
  }

  const unlock = await fetchKnockUnlock(creatorId);
  if (!unlock) return { error: "此工作室目前無法查看內容" };
  return { success: true, unlock };
}
