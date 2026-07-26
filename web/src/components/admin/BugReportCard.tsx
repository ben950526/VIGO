"use client";

import { useState } from "react";
import { updateBugReport } from "@/actions/admin-bugs";
import type { BugReportItem, BugReportStatus } from "@/types/database";

const statusOptions: { value: BugReportStatus; label: string }[] = [
  { value: "open", label: "待處理" },
  { value: "investigating", label: "處理中" },
  { value: "fixed", label: "已修復" },
  { value: "wont_fix", label: "無法重現" },
];

const statusBadge: Record<BugReportStatus, string> = {
  open: "bg-amber-100 text-amber-900",
  investigating: "bg-blue-100 text-blue-900",
  fixed: "bg-green-100 text-green-900",
  wont_fix: "bg-gray-100 text-gray-700",
};

interface BugReportCardProps {
  item: BugReportItem;
}

export function BugReportCard({ item }: BugReportCardProps) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaved(false);
    setError("");
    const result = await updateBugReport(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[item.status]}`}
        >
          {statusOptions.find((o) => o.value === item.status)?.label ?? item.status}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {new Date(item.created_at).toLocaleString("zh-TW")}
        </span>
      </div>

      <p className="whitespace-pre-wrap font-medium text-[var(--text)]">{item.message}</p>

      {item.steps && (
        <div className="mt-3 rounded-lg bg-[var(--bg)] px-3 py-2 text-sm">
          <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">操作步驟</p>
          <p className="whitespace-pre-wrap">{item.steps}</p>
        </div>
      )}

      <div className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
        {item.page_url && <p>頁面：{item.page_url}</p>}
        {item.viewport && <p>視窗：{item.viewport}</p>}
        {item.user_agent && <p className="break-all">裝置：{item.user_agent}</p>}
      </div>

      <form action={handleSubmit} className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
        <input type="hidden" name="id" value={item.id} />
        <div className="flex flex-wrap gap-3">
          <select name="status" defaultValue={item.status} className="input w-auto text-sm">
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary text-sm">
            更新狀態
          </button>
          {saved && <span className="self-center text-xs text-green-700">已儲存</span>}
        </div>
        <textarea
          name="admin_note"
          className="input min-h-16 text-sm"
          defaultValue={item.admin_note ?? ""}
          placeholder="內部備註（選填）"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </li>
  );
}
