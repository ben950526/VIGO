"use server";

import { getAuthUserId } from "@/lib/auth/session";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export async function recordStudioPageView(params: {
  creatorId: string;
  visitorKey: string;
}): Promise<void> {
  const creatorId = params.creatorId.trim();
  const visitorKey = params.visitorKey.trim();
  if (!creatorId || !visitorKey || !isSupabaseConfigured()) return;

  const ownerId = await getAuthUserId();
  if (ownerId) {
    const authed = await createClient();
    const { data: own } = await authed
      .from("creator_profiles")
      .select("id")
      .eq("id", creatorId)
      .eq("user_id", ownerId)
      .maybeSingle();
    if (own) return;
  }

  const supabase = createPublicClient();

  const { error } = await supabase.from("studio_page_views").insert({
    creator_id: creatorId,
    visitor_key: visitorKey,
  });

  if (error && error.code !== "23505") {
    if (error.message.includes("studio_page_views") || error.message.includes("schema cache")) {
      return;
    }
    console.error("[page-view]", error.message);
  }
}
