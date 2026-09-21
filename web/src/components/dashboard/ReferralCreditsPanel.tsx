"use client";

import { useState } from "react";
import {
  REFERRAL_CREDIT_MAX_BALANCE,
  REFERRAL_CREDIT_PER_SIGNUP,
  REFERRAL_TERMS_SUMMARY,
} from "@/lib/referral/config";

type Props = {
  inviteCode: string;
  referralUrl: string;
  balance: number;
  successfulInvites: number;
};

export function ReferralCreditsPanel({
  inviteCode,
  referralUrl,
  balance,
  successfulInvites,
}: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  async function copyText(text: string, kind: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === "link") {
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        window.setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      id="referral"
      className="mb-8 scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <h2 className="mb-1 text-xl font-bold">推廣累點 · 我的邀請碼</h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        分享下方<strong className="font-medium text-[var(--text)]">邀請碼</strong>或
        <strong className="font-medium text-[var(--text)]">邀請連結</strong>，好友完成接案者註冊後您可獲得{" "}
        {REFERRAL_CREDIT_PER_SIGNUP} 點折抵（累積上限 {REFERRAL_CREDIT_MAX_BALANCE} 點）。此區塊會一直保留在儀表板。
      </p>

      <div className="mb-4 rounded-xl border border-[var(--accent-soft)] bg-[var(--bg)] px-4 py-4">
        <p className="text-xs font-medium text-[var(--text-muted)]">您帳號的專屬邀請碼</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="font-mono text-2xl font-bold tracking-widest text-[var(--accent)]">{inviteCode}</p>
          <button
            type="button"
            onClick={() => copyText(inviteCode, "code")}
            className="btn-secondary shrink-0 text-sm sm:ml-auto"
          >
            {copiedCode ? "已複製邀請碼" : "複製邀請碼"}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          好友註冊時可填此推薦碼，或使用下方連結（兩者擇一即可）。
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <p className="text-xs text-[var(--text-muted)]">目前折抵點</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {balance}
            <span className="text-base font-normal text-[var(--text-muted)]">
              {" "}
              / {REFERRAL_CREDIT_MAX_BALANCE}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <p className="text-xs text-[var(--text-muted)]">成功邀請註冊</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{successfulInvites} 人</p>
        </div>
      </div>

      <label className="mb-1 block text-sm font-medium">專屬邀請連結</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          className="input min-w-0 flex-1 text-sm"
          value={referralUrl}
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          onClick={() => copyText(referralUrl, "link")}
          className="btn-secondary shrink-0 text-sm"
        >
          {copiedLink ? "已複製連結" : "複製連結"}
        </button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
        {REFERRAL_TERMS_SUMMARY} 詳見{" "}
        <a href="/terms#promo-credits" className="text-[var(--accent)] hover:underline">
          使用條款
        </a>
        。
      </p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        訂閱方案尚未上線，折抵點目前僅累積與查詢；上線後可於結帳時依公告規則使用。
      </p>
    </div>
  );
}
