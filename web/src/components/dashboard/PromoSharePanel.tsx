"use client";

import { useActionState, useState } from "react";
import { submitPromoShareProof, type PromoShareFormState } from "@/actions/promo-share";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  buildSocialShareCopyText,
  SOCIAL_SHARE_CREDIT,
  SOCIAL_SHARE_MAX_APPROVED,
} from "@/lib/referral/config";
import type { PromoShareSubmission } from "@/lib/data/promo-share";

const initialState: PromoShareFormState = {};

const PLATFORM_LABEL: Record<string, string> = {
  threads: "Threads",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  other: "其他",
};

type Props = {
  inviteCode: string;
  referralUrl: string;
  submissions: PromoShareSubmission[];
};

export function PromoSharePanel({ inviteCode, referralUrl, submissions }: Props) {
  const [state, formAction, pending] = useActionState(submitPromoShareProof, initialState);
  const [copied, setCopied] = useState(false);

  const copyText = buildSocialShareCopyText({ referralUrl, inviteCode });
  const approved = submissions.find((s) => s.status === "approved");
  const pendingRow = submissions.find((s) => s.status === "pending");
  const canSubmit = !approved && !pendingRow;

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="mb-1 text-xl font-bold">社群宣傳拿點數</h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        在 Threads、Facebook、Instagram、TikTok 等<strong>公開貼文</strong>宣傳 Vigo，
        附上您的邀請連結或邀請碼，送審通過可獲 <strong>{SOCIAL_SHARE_CREDIT} 點</strong>
        （每人終身 <strong>{SOCIAL_SHARE_MAX_APPROVED} 次</strong>，與拉新共用折抵上限）。
      </p>

      <label className="mb-1 block text-sm font-medium">建議宣傳文案（可複製後再加一句自己的話）</label>
      <textarea readOnly className="input mb-2 min-h-[160px] w-full text-sm leading-relaxed" value={copyText} />
      <button type="button" onClick={copyShareText} className="btn-secondary mb-4 text-sm">
        {copied ? "已複製文案" : "複製宣傳文案"}
      </button>

      {approved ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          已通過審核，獲得 {approved.credits_awarded} 點（{PLATFORM_LABEL[approved.platform] ?? approved.platform}）。
        </p>
      ) : pendingRow ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          審核中：{PLATFORM_LABEL[pendingRow.platform] ?? pendingRow.platform} ·{" "}
          <a href={pendingRow.post_url} target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">
            查看貼文
          </a>
        </p>
      ) : (
        <form action={formAction} className="space-y-3 border-t border-[var(--border)] pt-4">
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.ok && state.message && (
            <p className="text-sm text-green-700">{state.message}</p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">平台</label>
            <select className="input w-full" name="platform" required defaultValue="threads">
              <option value="threads">Threads</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">公開貼文連結</label>
            <input
              className="input w-full"
              name="post_url"
              type="url"
              required
              placeholder="https://..."
            />
          </div>
          <SubmitButton className="btn-primary text-sm" disabled={!canSubmit || pending}>
            {pending ? "送出中…" : "送出宣傳證明"}
          </SubmitButton>
        </form>
      )}

      {submissions.some((s) => s.status === "rejected") && !approved && !pendingRow ? (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          上次未通過：{submissions.find((s) => s.status === "rejected")?.admin_note ?? "請確認為公開貼文且含邀請連結／邀請碼"}。
          可修正後再次送出。
        </p>
      ) : null}
    </div>
  );
}
