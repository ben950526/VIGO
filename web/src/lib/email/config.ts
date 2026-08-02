export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://vigo-woad.vercel.app";
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Vigo <notify@mail.try-vigo.com>";
}

export function resendApiKey(): string | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return apiKey;
}
