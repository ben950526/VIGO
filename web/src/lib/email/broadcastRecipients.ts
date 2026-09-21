import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type BroadcastRecipient = {
  email: string;
  studioName: string;
  verificationStatus: string;
};

export type BroadcastAudience = "creators" | "all_registered";

function isExcludedEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return lower.endsWith("@vigo.local") || lower.startsWith("demo-");
}

export async function fetchBroadcastRecipients(options: {
  onlyApproved: boolean;
  audience: BroadcastAudience;
}): Promise<BroadcastRecipient[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (options.audience === "all_registered") {
    const { data: profiles, error } = await supabase.from("profiles").select("id, email, role");
    if (error) throw new Error(`讀取使用者失敗：${error.message}`);

    const byEmail = new Map<string, BroadcastRecipient>();
    for (const p of profiles ?? []) {
      const email = p.email?.trim();
      if (!email || isExcludedEmail(email)) continue;
      const lower = email.toLowerCase();
      if (byEmail.has(lower)) continue;
      byEmail.set(lower, {
        email,
        studioName: "",
        verificationStatus: p.role ?? "creator",
      });
    }
    return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
  }

  let profileQuery = supabase
    .from("creator_profiles")
    .select("user_id, studio_name, verification_status")
    .eq("is_demo", false);

  if (options.onlyApproved) {
    profileQuery = profileQuery.eq("verification_status", "approved");
  }

  const { data: creators, error: creatorError } = await profileQuery;
  if (creatorError) throw new Error(`讀取創作者失敗：${creatorError.message}`);
  if (!creators?.length) return [];

  const userIds = [...new Set(creators.map((c) => c.user_id))];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  if (profileError) throw new Error(`讀取 Email 失敗：${profileError.message}`);

  const emailByUserId = new Map(
    (profiles ?? []).map((p) => [p.id, p.email.trim()] as const),
  );

  const byEmail = new Map<string, BroadcastRecipient>();

  for (const row of creators) {
    const email = emailByUserId.get(row.user_id)?.trim();
    if (!email || isExcludedEmail(email)) continue;
    const lower = email.toLowerCase();
    if (byEmail.has(lower)) continue;
    byEmail.set(lower, {
      email,
      studioName: row.studio_name,
      verificationStatus: row.verification_status,
    });
  }

  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}
