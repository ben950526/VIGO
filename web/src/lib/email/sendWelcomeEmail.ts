import { siteUrl } from "@/lib/email/config";
import { dispatchEmail } from "@/lib/email/dispatchEmail";
import { buildWelcomeEmailHtml, welcomeEmailSubject } from "@/lib/email/welcomeEmailHtml";

export async function sendSignupWelcomeEmail(params: {
  to: string;
  studioName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = siteUrl();
  return dispatchEmail({
    to: params.to,
    subject: welcomeEmailSubject(),
    html: buildWelcomeEmailHtml({
      studioName: params.studioName,
      studioEditUrl: `${baseUrl}/dashboard/studio`,
      dashboardUrl: `${baseUrl}/dashboard`,
      loginUrl: `${baseUrl}/login`,
    }),
  });
}
