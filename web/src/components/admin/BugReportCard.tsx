"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBugReport } from "@/actions/admin-bugs";
import type { BugReportItem, BugReportStatus } from "@/types/database";

const statusOptions: { value: BugReportStatus; label: string }[] = [
  { value: "open", label: "待處理" },
  { value: "investigating", label: "處理中" },
  { value: "fixed", label: "已修好（等對方確認）" },
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
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaved(false);
    setError("");
    setNotice("");
    const result = await updateBugReport(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    const nextStatus = String(formData.get("status") ?? "");
    if (nextStatus === "wont_fix") {
      setHidden(true);
      router.refresh();
      return;
    }
    setSaved(true);
    router.refresh();
    if (result.notified) {
      setNotice("已寄信告訴對方，並附上重試步驟");
    } else if (result.notifyError) {
      setNotice(result.notifyError);
    }
  }

  if (hidden) return null;

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[item.status]}`}
        >
          {item.status === "fixed" && item.user_confirmed_at
            ? "對方已確認"
            : statusOptions.find((o) => o.value === item.status)?.label ?? item.status}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {new Date(item.created_at).toLocaleString("zh-TW")}
        </span>
        {item.notified_at && (
          <span className="text-xs text-green-700">
            已通知 {new Date(item.notified_at).toLocaleString("zh-TW")}
          </span>
        )}
        {item.user_confirmed_at && (
          <span className="text-xs text-green-700">
            對方確認 {new Date(item.user_confirmed_at).toLocaleString("zh-TW")}
          </span>
        )}
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
        <p>
          信箱：{item.contact_email || (item.reporter_id ? "已登入（可從帳號查出信箱）" : "未留下")}
        </p>
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
          placeholder="內部備註（不會寄給對方）"
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
            通知對方的 Email
          </label>
          <input
            type="email"
            name="contact_email"
            className="input text-sm"
            defaultValue={item.contact_email ?? ""}
            placeholder="舊回報沒留信箱時可手動填"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
            給對方的重試步驟（會寫進信裡）
          </label>
          <textarea
            name="user_reply"
            className="input min-h-24 text-sm"
            defaultValue={item.user_reply ?? ""}
            maxLength={4000}
            placeholder={
              "例如：\n1. 重新整理或登出再登入\n2. 打開「編輯工作室內容」\n3. 依你當時卡住的動作再做一次"
            }
          />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="notify_reporter"
            value="1"
            className="mt-1"
            defaultChecked={item.status === "fixed" && !item.notified_at}
          />
          <span>
            標成已修好時，寄信請對方再試；對方會先「去再試一次」，再選「已修復」或「還有問題」
            {item.notified_at ? "（已寄過，勾選會再寄一次）" : ""}
          </span>
        </label>
        {notice && <p className="text-sm text-[var(--text-secondary)]">{notice}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </li>
  );
}
