import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthProfile, getAuthUserId, isAdminProfile } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/utils";

export type NavAuth = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  /** 用 Google 登入的發案者 */
  isClient?: boolean;
};

export const getNavAuth = cache(async (): Promise<NavAuth> => {
  if (!isSupabaseConfigured()) {
    return { isLoggedIn: false, isAdmin: false };
  }

  const userId = await getAuthUserId();
  if (!userId) {
    return { isLoggedIn: false, isAdmin: false };
  }

  const profile = await getAuthProfile();
  if (!profile) {
    return { isLoggedIn: true, isAdmin: false };
  }

  const isAdmin = isAdminProfile(profile);
  return { isLoggedIn: true, isAdmin, isClient: !isAdmin && profile.role === "client" };
});
