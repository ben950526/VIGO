import { escapeHtml } from "@/lib/email/escapeHtml";

export function plainTextToBroadcastHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  return trimmed
    .split(/\n{2,}/)
    .map((block) => {
      const inner = escapeHtml(block).replace(/\n/g, "<br />");
      return `<p style="margin: 0 0 1em;">${inner}</p>`;
    })
    .join("");
}

export function applyBroadcastPlaceholders(
  text: string,
  studioName: string | null | undefined,
): string {
  const name = studioName?.trim() || "創作者";
  return text.replaceAll("{{studio_name}}", name);
}

export function buildAdminBroadcastHtml(params: {
  siteUrl: string;
  studioName?: string | null;
  bodyPlain: string;
}): string {
  const base = params.siteUrl.replace(/\/$/, "");
  const greeting = params.studioName?.trim()
    ? `<p style="margin: 0 0 1em;">Hi，${escapeHtml(params.studioName.trim())}：</p>`
    : `<p style="margin: 0 0 1em;">Hi，</p>`;

  const bodyWithPlaceholders = applyBroadcastPlaceholders(params.bodyPlain, params.studioName);
  const bodyHtml = plainTextToBroadcastHtml(bodyWithPlaceholders);

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px;">
  ${greeting}
  ${bodyHtml}
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #e5e5e5;" />
  <p style="font-size: 12px; color: #666;">
    你會收到這封信，是因為曾在 <a href="${base}">Vigo</a> 註冊帳號。
    若不想再收到平台公告，請至 <a href="${base}/feedback">意見回饋</a> 告知我們。
  </p>
  <p style="font-size: 12px; color: #666;">— Vigo 團隊</p>
</body>
</html>`;
}
