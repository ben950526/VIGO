"use client";

import { useState } from "react";
import { useClientValue } from "@/lib/hooks/useClientValue";
import { confirmOwnBugFixed, reopenOwnBug } from "@/actions/bug-report";
import {
  bugTriedStorageKey,
  goRetryBugPage,
} from "@/lib/bugs/retryPage";
import type { PendingBugConfirm } from "@/lib/data/bug-confirms";

export function BugFixConfirmBanner({ items }: { items: PendingBugConfirm[] }) {
  const [queue, setQueue] = useState(items);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [triedLocalId, setTriedLocalId] = useState<string | null>(null);
  const current = queue[0];
  const triedStored = useClientValue(
    () => (current ? sessionStorage.getItem(bugTriedStorageKey(current.id)) === "1" : false),
    false,
  );
  const tried = Boolean(current) && (triedStored || triedLocalId === current?.id);

  if (!current) return null;

  function handleRetry() {
    sessionStorage.setItem(bugTriedStorageKey(current.id), "1");
    setTriedLocalId(current.id);
    goRetryBugPage(current.page_url);
  }

  async function handleResult(kind: "fixed" | "still") {
    setPending(true);
    setError("");
    const result =
      kind === "fixed"
        ? await confirmOwnBugFixed(current.id)
        : await reopenOwnBug(current.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    sessionStorage.removeItem(bugTriedStorageKey(current.id));
    setQueue((prev) => prev.filter((item) => item.id !== current.id));
  }

  return (
    <div className="relative z-20 border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-4 md:px-12">
        <p className="text-sm font-medium text-amber-950">
          你回報的問題我們修好了。請先按「去再試一次」，實際操作過後再告訴我們結果。
        </p>
        <p className="line-clamp-2 text-sm text-amber-900">{current.message}</p>
        {current.user_reply ? (
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{current.user_reply}</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${tried ? "btn-secondary" : "btn-primary"} text-sm`}
            disabled={pending}
            onClick={handleRetry}
          >
            去再試一次
          </button>
        </div>
        {tried ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-amber-900">試過了嗎？請選一個：</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={pending}
                onClick={() => void handleResult("fixed")}
              >
                {pending ? "送出中…" : "已修復"}
              </button>
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={pending}
                onClick={() => void handleResult("still")}
              >
                還有問題
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
