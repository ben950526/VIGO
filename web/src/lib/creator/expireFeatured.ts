import { revalidatePath, revalidateTag } from "next/cache";
import { CREATOR_LIST_TAG } from "@/lib/cache/revalidate";
import { createServiceClient } from "@/lib/supabase/service";

/** 每日排程：宣傳換來的精選到期就取消（管理員手動設的精選沒有到期日，不受影響） */
export async function expirePromoFeatured(): Promise<{ ok: boolean; expired: number; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, expired: 0, error: "no service client" };

  const { data, error } = await supabase
    .from("creator_profiles")
    .update({ featured: false, featured_until: null })
    .eq("featured", true)
    .lt("featured_until", new Date().toISOString())
    .select("id");

  // 037 還沒跑時沒有 featured_until 欄位，略過即可
  if (error) return { ok: false, expired: 0, error: error.message };

  const expired = data?.length ?? 0;
  if (expired > 0) {
    // 排程是 Route Handler，不能用 updateTag
    revalidateTag(CREATOR_LIST_TAG, "max");
    revalidatePath("/");
    revalidatePath("/explore");
  }
  return { ok: true, expired };
}
