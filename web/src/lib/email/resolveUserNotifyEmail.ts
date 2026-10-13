import { adminNotifyEmail } from "@/lib/email/config";
import { createServiceClient } from "@/lib/supabase/service";

function normalizeEmail(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase() || "";
  if (!trimmed || !trimmed.includes("@")) return null;
  if (trimmed.endsWith("@vigo.local") || trimmed.startsWith("demo-")) return null;
  return trimmed;
}

/**
 * 平台通知一律寄到登入信箱，不用工作室公開的聯絡 Email。
 * 聯絡 Email 是給發案者看的，可能跟帳號不同，也不該落到管理員信箱。
 */
export async function resolveUserNotifyEmail(params: {
  userId: string;
  contactEmail?: string | null;
}): Promise<string | null> {
  const service = createServiceClient();
  let loginEmail: string | null = null;

  if (service) {
    const { data, error } = await service.auth.admin.getUserById(params.userId);
    if (error) {
      console.error("[email] getUserById failed:", error.message);
    } else {
      loginEmail = normalizeEmail(data.user?.email);
    }

    if (!loginEmail) {
      const { data: profile } = await service
        .from("profiles")
        .select("email")
        .eq("id", params.userId)
        .maybeSingle();
      loginEmail = normalizeEmail(profile?.email);
    }
  }

  if (loginEmail) return loginEmail;

  const contact = normalizeEmail(params.contactEmail);
  const admin = adminNotifyEmail()?.toLowerCase() ?? null;
  if (contact && contact !== admin) return contact;

  return null;
}
