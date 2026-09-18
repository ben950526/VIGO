"use client";

import { useState } from "react";
import {
  REFERRAL_CREDIT_MAX_BALANCE,
  REFERRAL_CREDIT_PER_SIGNUP,
  REFERRAL_TERMS_SUMMARY,
} from "@/lib/referral/config";

type Props = {
  referralUrl: string;
  balance: number;
  successfulInvites: number;
};

export function ReferralCreditsPanel({ referralUrl, balance, successfulInvites }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = referralUrl;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="mb-1 text-xl font-bold">推廣累點</h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        分享專屬連結，好友透過連結完成接案者註冊，您可獲得 {REFERRAL_CREDIT_PER_SIGNUP} 點折抵（累積上限{" "}
        {REFERRAL_CREDIT_MAX_BALANCE} 點）。
      </p>

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

      <label className="mb-1 block text-sm font-medium">您的專屬邀請連結</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          className="input min-w-0 flex-1 text-sm"
          value={referralUrl}
          onFocus={(e) => e.currentTarget.select()}
        />
        <button type="button" onClick={copyLink} className="btn-secondary shrink-0 text-sm">
          {copied ? "已複製" : "複製連結"}
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
