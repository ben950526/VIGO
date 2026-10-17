"use client";

import { useState } from "react";
import Link from "next/link";
import { confirmOwnBugFixed } from "@/actions/bug-report";
import type { PendingBugConfirm } from "@/lib/data/bug-confirms";

function retryHref(pageUrl: string | null): string {
  const raw = pageUrl?.trim();
  if (raw?.startsWith("/")) return raw;
  return "/dashboard/studio";
}

export function BugFixConfirmBanner({ items }: { items: PendingBugConfirm[] }) {
  const [queue, setQueue] = useState(items);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const current = queue[0];
  if (!current) return null;

  async function handleConfirm() {
    setPending(true);
    setError("");
    const result = await confirmOwnBugFixed(current.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setQueue((prev) => prev.filter((item) => item.id !== current.id));
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-4 md:px-12">
        <p className="text-sm font-medium text-amber-950">
          你回報的問題我們修好了。請再試一次；若已經正常，按「已修復」。
        </p>
        <p className="line-clamp-2 text-sm text-amber-900">{current.message}</p>
        {current.user_reply ? (
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{current.user_reply}</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={pending}
            onClick={() => void handleConfirm()}
          >
            {pending ? "送出中…" : "已修復"}
          </button>
          <Link href={retryHref(current.page_url)} className="btn-secondary text-sm">
            去再試一次
          </Link>
        </div>
      </div>
    </div>
  );
}
