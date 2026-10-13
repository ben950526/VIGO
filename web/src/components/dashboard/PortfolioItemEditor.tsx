"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePortfolioItem, setFeaturedPortfolioItem, updatePortfolioItem } from "@/actions/creator";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { isFeaturedPortfolioItem } from "@/lib/portfolio";
import type { PortfolioItem } from "@/types/database";

export function PortfolioItemEditor({
  item,
  portfolio,
}: {
  item: PortfolioItem;
  portfolio: PortfolioItem[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isFeatured = isFeaturedPortfolioItem(item, portfolio);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await updatePortfolioItem(new FormData(event.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`確定移除「${item.title}」？公開頁也不會再顯示。`)) return;
    setPending(true);
    setError("");
    const formData = new FormData();
    formData.set("id", item.id);
    const result = await deletePortfolioItem(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const statusLabel =
    item.status === "approved" ? "已公開" : item.status === "pending" ? "審核中" : "未通過";

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <input type="hidden" name="id" value={item.id} />
          <input className="input" name="title" defaultValue={item.title} required placeholder="作品標題" />
          <textarea
            className="input min-h-20"
            name="description"
            defaultValue={item.description ?? ""}
            placeholder="作品說明（選填）"
          />
          <input
            className="input"
            name="embed_url"
            defaultValue={item.embed_url}
            required
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-xs text-[var(--text-muted)]">
            改連結會再送審一次；只改標題或說明則維持目前狀態。
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="btn-primary text-sm disabled:opacity-70">
              {pending ? "儲存中…" : "儲存修改"}
            </button>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => {
                setEditing(false);
                setError("");
              }}
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="font-medium">{item.title}</p>
              {isFeatured && item.status === "approved" && (
                <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                  精選作品
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text-muted)]">狀態：{statusLabel}</p>
            <p className="mt-1 break-all text-xs text-[var(--text-muted)]">{item.embed_url}</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isFeatured && item.status === "approved" && (
              <form action={setFeaturedPortfolioItem}>
                <input type="hidden" name="id" value={item.id} />
                <SubmitButton className="btn-secondary text-sm">設為精選</SubmitButton>
              </form>
            )}
            <button type="button" className="btn-secondary text-sm" onClick={() => setEditing(true)}>
              修改連結
            </button>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => void handleDelete()}
              disabled={pending}
            >
              移除
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
