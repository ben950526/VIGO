import { escapeHtml } from "@/lib/email/escapeHtml";

export type AdminReviewNotifyKind = "new_creator" | "profile_update" | "new_portfolio";

interface AdminReviewNotifyHtmlParams {
  kind: AdminReviewNotifyKind;
  studioName: string;
  slug: string;
  reviewUrl: string;
  portfolioTitle?: string;
}

const kindLabels: Record<AdminReviewNotifyKind, string> = {
  new_creator: "新接案者註冊",
  profile_update: "工作室資料更新（待審）",
  new_portfolio: "新作品待審",
};

export function buildAdminReviewNotifyHtml(params: AdminReviewNotifyHtmlParams): string {
  const { kind, studioName, slug, reviewUrl, portfolioTitle } = params;
  const label = kindLabels[kind];

  const extra =
    kind === "new_portfolio" && portfolioTitle
      ? `<p>作品標題：<strong>${escapeHtml(portfolioTitle)}</strong></p>`
      : "";

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px; margin-bottom: 12px;">Vigo 審核提醒</h1>
  <p>有新的送審項目需要你處理。</p>
  <p><strong>類型：</strong>${escapeHtml(label)}</p>
  <p><strong>工作室：</strong>${escapeHtml(studioName)}</p>
  <p><strong>Slug：</strong>${escapeHtml(slug)}</p>
  ${extra}
  <p style="margin: 24px 0;">
    <a href="${reviewUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">前往審核後台</a>
  </p>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">此信由 Vigo 系統自動發送。</p>
</body>
</html>`;
}
