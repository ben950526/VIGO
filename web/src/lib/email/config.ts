export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://vigo-woad.vercel.app";
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Vigo <notify@mail.try-vigo.com>";
}

export function resendApiKey(): string | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return apiKey;
}

export function adminNotifyEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim();
  return email || null;
}

/** 與收件人相同時不密件副本，避免管理員自己審自己的測試帳重複收信 */
export function adminBccFor(to: string): string | undefined {
  const admin = adminNotifyEmail();
  if (!admin) return undefined;
  if (admin.toLowerCase() === to.trim().toLowerCase()) return undefined;
  return admin;
}
