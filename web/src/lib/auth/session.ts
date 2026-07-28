import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export const getAuthSession = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
});

export const getAuthUserId = cache(async (): Promise<string | null> => {
  const session = await getAuthSession();
  return session?.user?.id ?? null;
});

export type AuthProfile = {
  id: string;
  role: string;
  email: string;
};

export const getAuthProfile = cache(async (): Promise<AuthProfile | null> => {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", userId)
    .single();

  return data as AuthProfile | null;
});

export function isAdminProfile(profile: AuthProfile): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const emailMatch = adminEmail && profile.email.toLowerCase() === adminEmail;
  return profile.role === "admin" || Boolean(emailMatch);
}
