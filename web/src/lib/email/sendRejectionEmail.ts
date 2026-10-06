import { siteUrl } from "@/lib/email/config";
import { dispatchEmail } from "@/lib/email/dispatchEmail";
import { buildRejectionEmailHtml } from "@/lib/email/rejectionEmailHtml";

export async function sendCreatorRejectionEmail(params: {
  to: string;
  studioName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = siteUrl();
  return dispatchEmail({
    to: params.to,
    subject: `【Vigo】「${params.studioName}」這次還沒過，方便再補一下`,
    html: buildRejectionEmailHtml({
      studioName: params.studioName,
      profileUrl: `${baseUrl}/dashboard/studio`,
      dashboardUrl: `${baseUrl}/dashboard`,
    }),
  });
}
