import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthProfile,
  isAdminProfile,
} from "@/lib/auth/session";
import type { Profile } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/utils";

export const getCurrentUserProfile = cache(async (): Promise<Profile | null> => {
  const profile = await getAuthProfile();
  return profile as Profile | null;
});

export async function requireAdmin(): Promise<Profile> {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const profile = await getAuthProfile();
  if (!profile) redirect("/login");

  if (!isAdminProfile(profile)) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const emailMatch = adminEmail && profile.email.toLowerCase() === adminEmail;

    if (emailMatch) {
      const supabase = await createClient();
      await supabase.from("profiles").update({ role: "admin" }).eq("id", profile.id);
      return { ...profile, role: "admin" } as Profile;
    }

    redirect("/dashboard");
  }

  return profile as Profile;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getAuthProfile();
  if (!profile) return false;

  if (isAdminProfile(profile)) return true;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const emailMatch = adminEmail && profile.email.toLowerCase() === adminEmail;
  if (!emailMatch) return false;

  const supabase = await createClient();
  await supabase.from("profiles").update({ role: "admin" }).eq("id", profile.id);
  return true;
}
