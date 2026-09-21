"use client";

import { useActionState, useEffect, useState } from "react";
import {
  getBroadcastRecipientCount,
  sendAdminBroadcast,
  type BroadcastFormState,
} from "@/actions/broadcast";
import type { BroadcastAudience } from "@/lib/email/broadcastRecipients";
const initialState: BroadcastFormState = {};

const DEFAULT_BODY = `Vigo 經過約一個月的內部優化，現在重新上線服務。

這段時間我們調整了登入註冊、工作室編輯、公開頁預覽與審核流程，也上了推廣累點（儀表板可複製你的專屬邀請碼）。

歡迎登入查看你的工作室與邀請碼。

感謝你早期就加入 Vigo。`;

export function BroadcastMailForm({ adminEmail }: { adminEmail: string }) {
  const [state, formAction, pending] = useActionState(sendAdminBroadcast, initialState);
  const [onlyApproved, setOnlyApproved] = useState(true);
  const [audience, setAudience] = useState<BroadcastAudience>("creators");
  const [count, setCount] = useState<number | null>(null);
  const [countError, setCountError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getBroadcastRecipientCount(onlyApproved, audience).then((res) => {
      if (cancelled) return;
      setCount(res.count);
      setCountError(res.error ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [onlyApproved, audience]);

  function confirmSend(event: React.FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value !== "send") return;
    if (count && count > 0 && !window.confirm(`確定要群發給約 ${count} 人？此操作無法撤回。`)) {
      event.preventDefault();
    }
  }

  return (
    <div className="space-y-6">
      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {state.message}
          {state.errors && state.errors.length > 0 ? (
            <span className="mt-2 block text-red-700">{state.errors.join("；")}</span>
          ) : null}
        </p>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm">
        <p className="font-medium">預估收件人數</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">
          {count === null ? "…" : count}
          <span className="text-base font-normal text-[var(--text-muted)]"> 人</span>
        </p>
        {countError ? <p className="mt-1 text-red-600">{countError}</p> : null}
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          已排除示範帳號與 @vigo.local。變更下方選項會自動重算。
        </p>
      </div>

      <form action={formAction} onSubmit={confirmSend} className="space-y-4">
        <fieldset className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <legend className="px-1 text-sm font-medium">寄送對象</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="audience"
              value="creators"
              checked={audience === "creators"}
              onChange={() => setAudience("creators")}
            />
            已註冊接案者（有工作室 profile）
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="audience"
              value="all_registered"
              checked={audience === "all_registered"}
              onChange={() => setAudience("all_registered")}
            />
            所有 profiles 帳號（仍排除 demo）
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="only_approved"
              checked={onlyApproved}
              onChange={(e) => setOnlyApproved(e.target.checked)}
            />
            僅「已審核通過」的接案者（只對接案者名單有效）
          </label>
        </fieldset>

        <div>
          <label className="mb-1 block text-sm font-medium">Email 主旨</label>
          <input
            className="input w-full"
            name="subject"
            required
            defaultValue="【Vigo】沉潛一個月，我們回來了——邀請你回來看看工作室"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">內文（純文字）</label>
          <textarea
            className="input min-h-[220px] w-full font-mono text-sm leading-relaxed"
            name="body"
            required
            defaultValue={DEFAULT_BODY}
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            空行分段。可用 {"{{studio_name}}"} 帶入工作室名稱。系統會自動加上問候與頁尾聲明。
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">建議流程</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>先按「寄測試信給我」檢查排版與連結</li>
            <li>確認無誤後，在確認欄輸入「確認發送」，再按「一鍵群發」</li>
          </ol>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">測試收件 Email</label>
          <input
            className="input w-full"
            name="test_email"
            type="email"
            defaultValue={adminEmail}
          />
        </div>

        <button
          type="submit"
          name="intent"
          value="test"
          disabled={pending}
          className="btn-secondary disabled:opacity-70"
        >
          {pending ? "寄送中…" : "寄測試信給我"}
        </button>

        <div>
          <label className="mb-1 block text-sm font-medium text-red-700">
            正式群發確認（請輸入「確認發送」）
          </label>
          <input className="input w-full" name="confirm" autoComplete="off" placeholder="確認發送" />
        </div>

        <button
          type="submit"
          name="intent"
          value="send"
          disabled={pending || count === 0}
          className="btn-primary w-full disabled:opacity-70 sm:w-auto"
        >
          {pending ? "群發中…" : "一鍵群發"}
        </button>
      </form>
    </div>
  );
}
