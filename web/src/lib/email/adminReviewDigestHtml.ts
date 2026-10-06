import type { AdminReviewNotifyKind } from "@/lib/email/adminReviewNotifyHtml";
import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailCta } from "@/lib/email/emailVoice";
import { formatTaipeiDateTime, taipeiDateString } from "@/lib/time/taipei";

export type DigestEventRow = {
  kind: AdminReviewNotifyKind;
  studio_name: string;
  slug: string;
  portfolio_title: string | null;
  created_at: string;
};

export type DigestFeedbackRow = {
  message: string;
  role: string | null;
  contact_email: string | null;
  page_url: string | null;
  created_at: string;
};

export type DigestBugRow = {
  message: string;
  steps: string | null;
  page_url: string | null;
  status: string;
  created_at: string;
};

const kindLabels: Record<AdminReviewNotifyKind, string> = {
  new_creator: "新註冊",
  profile_update: "工作室更新",
  new_portfolio: "新作品",
};

const roleLabels: Record<string, string> = {
  client: "發案者",
  creator: "接案者",
  visitor: "逛逛",
};

const bugStatusLabels: Record<string, string> = {
  open: "待處理",
  investigating: "處理中",
  fixed: "已修復",
  wont_fix: "無法重現",
};

function clip(text: string, max = 160): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function sectionHeading(title: string): string {
  return `<h2 style="font-size:16px;margin:28px 0 8px;">${escapeHtml(title)}</h2>`;
}

function emptyLine(text: string): string {
  return `<p style="color:#64748b;font-size:14px;">${escapeHtml(text)}</p>`;
}

export function buildAdminReviewDigestHtml(params: {
  reviewUrl: string;
  feedbackUrl: string;
  bugsUrl: string;
  rangeLabel: string;
  events: DigestEventRow[];
  feedback: DigestFeedbackRow[];
  bugs: DigestBugRow[];
}): string {
  const { reviewUrl, feedbackUrl, bugsUrl, rangeLabel, events, feedback, bugs } = params;
  const total = events.length + feedback.length + bugs.length;

  const reviewRows =
    events.length === 0
      ? emptyLine("昨天沒有新的送審。")
      : `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">
    <thead>
      <tr style="text-align:left;background:#f8fafc;">
        <th style="padding:8px;">類型</th>
        <th style="padding:8px;">工作室</th>
        <th style="padding:8px;">時間</th>
      </tr>
    </thead>
    <tbody>${events
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
      .join("")}</tbody>
  </table>`;

  const feedbackRows =
    feedback.length === 0
      ? emptyLine("昨天沒有新的使用者意見。")
      : `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">
    <thead>
      <tr style="text-align:left;background:#f8fafc;">
        <th style="padding:8px;">內容</th>
        <th style="padding:8px;">時間</th>
      </tr>
    </thead>
    <tbody>${feedback
      .map((item) => {
        const meta = [
          item.role ? roleLabels[item.role] ?? item.role : null,
          item.contact_email,
        ]
          .filter(Boolean)
          .join(" · ");
        return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(clip(item.message))}${
          meta ? `<br><span style="color:#64748b;font-size:12px;">${escapeHtml(meta)}</span>` : ""
        }${
          item.page_url
            ? `<br><span style="color:#64748b;font-size:12px;">${escapeHtml(item.page_url)}</span>`
            : ""
        }</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;white-space:nowrap;font-size:13px;">${escapeHtml(formatTaipeiDateTime(item.created_at))}</td>
      </tr>`;
      })
      .join("")}</tbody>
  </table>`;

  const bugRows =
    bugs.length === 0
      ? emptyLine("昨天沒有新的問題回報。")
      : `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">
    <thead>
      <tr style="text-align:left;background:#f8fafc;">
        <th style="padding:8px;">內容</th>
        <th style="padding:8px;">時間</th>
      </tr>
    </thead>
    <tbody>${bugs
      .map((item) => {
        const status = bugStatusLabels[item.status] ?? item.status;
        const extra = item.steps?.trim() ? `步驟：${clip(item.steps, 80)}` : "";
        return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:12px;">${escapeHtml(status)}</span><br>${escapeHtml(clip(item.message))}${
          extra
            ? `<br><span style="color:#64748b;font-size:12px;">${escapeHtml(extra)}</span>`
            : ""
        }${
          item.page_url
            ? `<br><span style="color:#64748b;font-size:12px;">${escapeHtml(item.page_url)}</span>`
            : ""
        }</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;white-space:nowrap;font-size:13px;">${escapeHtml(formatTaipeiDateTime(item.created_at))}</td>
      </tr>`;
      })
      .join("")}</tbody>
  </table>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px; margin-bottom: 8px;">昨天的平台狀況</h1>
  <p style="color:#64748b;">${escapeHtml(rangeLabel)} · 共 ${total} 筆新內容，有空再處理就好。</p>
  ${sectionHeading(`待審（${events.length}）`)}
  ${reviewRows}
  <p style="margin: 12px 0 0;">${emailCta(reviewUrl, "打開審核後台")}</p>
  ${sectionHeading(`使用者意見（${feedback.length}）`)}
  ${feedbackRows}
  <p style="margin: 12px 0 0;">${emailCta(feedbackUrl, "看全部意見")}</p>
  ${sectionHeading(`問題回報（${bugs.length}）`)}
  ${bugRows}
  <p style="margin: 12px 0 0;">${emailCta(bugsUrl, "看全部問題回報")}</p>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">這封信會在台北時間每天早上自動寄出。</p>
</body>
</html>`;
}

export function digestRangeLabel(start: Date): string {
  return `${taipeiDateString(start)} 台北時間`;
}

export function digestSubject(params: {
  rangeLabel: string;
  reviewCount: number;
  feedbackCount: number;
  bugCount: number;
}): string {
  const bits: string[] = [];
  if (params.reviewCount) bits.push(`${params.reviewCount} 筆待審`);
  if (params.feedbackCount) bits.push(`${params.feedbackCount} 則意見`);
  if (params.bugCount) bits.push(`${params.bugCount} 則問題回報`);
  if (bits.length === 0) return `【Vigo】昨天沒有新內容（${params.rangeLabel}）`;
  return `【Vigo】昨天有 ${bits.join("、")}（${params.rangeLabel}）`;
}
