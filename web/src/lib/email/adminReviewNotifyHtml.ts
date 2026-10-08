import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";

export type AdminReviewNotifyKind = "new_creator" | "profile_update" | "new_portfolio";

interface AdminReviewNotifyHtmlParams {
  kind: AdminReviewNotifyKind;
  studioName: string;
  slug: string;
  reviewUrl: string;
  portfolioTitle?: string;
}

const kindLabels: Record<AdminReviewNotifyKind, string> = {
  new_creator: "新工作室送審",
  profile_update: "工作室資料更新（待審）",
  new_portfolio: "新作品待審",
};

export function buildAdminReviewNotifyHtml(params: AdminReviewNotifyHtmlParams): string {
  const { kind, studioName, slug, reviewUrl, portfolioTitle } = params;
  const label = kindLabels[kind];

  const extra =
    kind === "new_portfolio" && portfolioTitle
      ? `<p>作品：<strong>${escapeHtml(portfolioTitle)}</strong></p>`
      : "";

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px; margin-bottom: 12px;">有一筆新的待審</h1>
  <p>嗨，有人送審了，有空再看就好。</p>
  <p><strong>類型：</strong>${escapeHtml(label)}</p>
  <p><strong>工作室：</strong>${escapeHtml(studioName)}</p>
  <p><strong>頁面：</strong>/creator/${escapeHtml(slug)}</p>
  ${extra}
  <p style="margin: 24px 0;">
    ${emailCta(reviewUrl, "打開審核後台")}
  </p>
  ${emailAutoFooter()}
</body>
</html>`;
}
