import { getAuthUserId } from "@/lib/auth/session";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/utils";

export async function recordStudioPageViewOnce(params: {
  creatorId: string;
  visitorKey: string;
}): Promise<void> {
  const creatorId = params.creatorId.trim();
  const visitorKey = params.visitorKey.trim();
  if (!creatorId || visitorKey.length < 8 || !isSupabaseConfigured()) return;

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

  const service = createServiceClient();
  const supabase = service ?? createPublicClient();

  const rpc = await supabase.rpc("record_studio_page_view", {
    p_creator_id: creatorId,
    p_visitor_key: visitorKey,
  });

  if (!rpc.error) return;
  if (
    rpc.error.message.includes("record_studio_page_view") ||
    rpc.error.message.includes("schema cache")
  ) {
    const { error } = await supabase.from("studio_page_views").insert({
      creator_id: creatorId,
      visitor_key: visitorKey,
    });
    if (error && error.code !== "23505") {
      console.error("[page-view]", error.message);
    }
    return;
  }

  if (rpc.error.code !== "23505") {
    console.error("[page-view]", rpc.error.message);
  }
}
