import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/utils";

export async function getCurrentUserProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

export async function requireAdmin(): Promise<Profile> {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const emailMatch =
    adminEmail && profile.email.toLowerCase() === adminEmail;

  if (profile.role !== "admin" && emailMatch) {
    await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", user.id);
    profile.role = "admin";
  }

  if (profile.role !== "admin") redirect("/dashboard");

  return profile as Profile;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile) return false;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const emailMatch =
    adminEmail && profile.email.toLowerCase() === adminEmail;

  // Only ADMIN_EMAIL (you) gets auto-promoted; other users stay creator
  if (profile.role !== "admin" && emailMatch) {
    const supabase = await createClient();
    await supabase.from("profiles").update({ role: "admin" }).eq("id", profile.id);
    return true;
  }

  return profile.role === "admin";
}
