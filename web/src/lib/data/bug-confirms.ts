import { cache } from "react";
import { getAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export type PendingBugConfirm = {
  id: string;
  message: string;
  user_reply: string | null;
  page_url: string | null;
};

export const getPendingBugConfirms = cache(async (): Promise<PendingBugConfirm[]> => {
  if (!isSupabaseConfigured()) return [];

  const session = await getAuthSession();
  const userId = session?.user?.id;
  const email = session?.user?.email?.trim().toLowerCase();
  if (!userId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("bug_reports")
    .select("id, message, user_reply, page_url")
    .eq("status", "fixed")
    .is("user_confirmed_at", null)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (email) {
    query = query.or(`reporter_id.eq.${userId},contact_email.eq."${email}"`);
  } else {
    query = query.eq("reporter_id", userId);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data as PendingBugConfirm[]) ?? [];
});
