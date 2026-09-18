import type { AdminReviewNotifyKind } from "@/lib/email/adminReviewNotifyHtml";
import { escapeHtml } from "@/lib/email/escapeHtml";
import { formatTaipeiDateTime, taipeiDateString } from "@/lib/time/taipei";

export type DigestEventRow = {
  kind: AdminReviewNotifyKind;
  studio_name: string;
  slug: string;
  portfolio_title: string | null;
  created_at: string;
};

const kindLabels: Record<AdminReviewNotifyKind, string> = {
  new_creator: "新註冊",
  profile_update: "工作室更新",
  new_portfolio: "新作品",
};

export function buildAdminReviewDigestHtml(params: {
  reviewUrl: string;
  rangeLabel: string;
  events: DigestEventRow[];
}): string {
  const { reviewUrl, rangeLabel, events } = params;

  if (events.length === 0) {
    return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px;">Vigo 審核每日摘要</h1>
  <p>${escapeHtml(rangeLabel)}：沒有新的送審項目。</p>
  <p><a href="${reviewUrl}">仍可到審核後台查看</a></p>
</body>
</html>`;
  }

  const rows = events
    .map((e) => {
      const detail =
        e.kind === "new_portfolio" && e.portfolio_title
          ? ` · ${escapeHtml(e.portfolio_title)}`
          : "";
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(kindLabels[e.kind])}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>${escapeHtml(e.studio_name)}</strong>${detail}<br><span style="color:#64748b;font-size:12px;">/creator/${escapeHtml(e.slug)}</span></td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;white-space:nowrap;font-size:13px;">${escapeHtml(formatTaipeiDateTime(e.created_at))}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px; margin-bottom: 8px;">Vigo 審核每日摘要</h1>
  <p style="color:#64748b;">${escapeHtml(rangeLabel)} · 共 ${events.length} 筆</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
    <thead>
      <tr style="text-align:left;background:#f8fafc;">
        <th style="padding:8px;">類型</th>
        <th style="padding:8px;">工作室</th>
        <th style="padding:8px;">時間</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin: 24px 0;">
    <a href="${reviewUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">前往審核後台</a>
  </p>
  <p style="font-size: 13px; color: #64748b;">此信於台北時間每日早上自動寄送。</p>
</body>
</html>`;
}

export function digestRangeLabel(start: Date): string {
  return `${taipeiDateString(start)} 送審紀錄`;
}
