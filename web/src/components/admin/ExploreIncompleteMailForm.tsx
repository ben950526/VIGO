"use client";

import { useActionState } from "react";
import {
  sendExploreIncompleteReminders,
  type ExploreIncompleteMailState,
} from "@/actions/admin";

const initial: ExploreIncompleteMailState = {};

export function ExploreIncompleteMailForm({ incompleteCount }: { incompleteCount: number }) {
  const [state, formAction, pending] = useActionState(sendExploreIncompleteReminders, initial);

  if (incompleteCount === 0) return null;

  return (
    <form action={formAction} className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="text-sm font-medium">群發完善信（{incompleteCount} 間）</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        只寄給已通過但探索頁還看不到的人，每人信裡寫還差哪一項。不會寄給已經在探索頁的工作室。
      </p>
      <label className="mt-3 block text-xs text-[var(--text-muted)]">
        確認欄請輸入「確認發送」
        <input
          name="confirm"
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          placeholder="確認發送"
          autoComplete="off"
        />
      </label>
      <button type="submit" className="btn-primary mt-3 text-sm" disabled={pending}>
        {pending ? "寄送中…" : "寄出完善信"}
      </button>
      {state.error ? <p className="mt-2 text-sm text-red-700">{state.error}</p> : null}
      {state.message ? <p className="mt-2 text-sm text-green-800">{state.message}</p> : null}
    </form>
  );
}