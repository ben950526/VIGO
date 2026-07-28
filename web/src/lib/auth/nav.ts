import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export type NavAuth = {
  isLoggedIn: boolean;
  isAdmin: boolean;
};

export const getNavAuth = cache(async (): Promise<NavAuth> => {
  if (!isSupabaseConfigured()) {
    return { isLoggedIn: false, isAdmin: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isLoggedIn: false, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { isLoggedIn: true, isAdmin: false };
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const emailMatch = adminEmail && profile.email.toLowerCase() === adminEmail;
  const isAdmin = profile.role === "admin" || Boolean(emailMatch);

  return { isLoggedIn: true, isAdmin };
});
