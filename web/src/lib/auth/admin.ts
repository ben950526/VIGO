import { cache } from "react";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getAuthProfile,
  isAdminProfile,
} from "@/lib/auth/session";
import type { Profile } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/utils";

/** 信箱符合 ADMIN_EMAIL 時把 role 補成 admin；一般使用者不能自己改 role（034），所以走 service role */
async function promoteToAdminRole(userId: string): Promise<void> {
  const service = createServiceClient();
  if (!service) return;
  await service.from("profiles").update({ role: "admin" }).eq("id", userId);
}

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
      await promoteToAdminRole(profile.id);
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

  await promoteToAdminRole(profile.id);
  return true;
}
