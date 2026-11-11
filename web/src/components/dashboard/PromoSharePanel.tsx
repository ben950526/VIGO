"use client";

import { useActionState, useState } from "react";
import { submitPromoShareProof, type PromoShareFormState } from "@/actions/promo-share";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  buildStudioShareText,
  PROMO_FEATURED_DAYS,
  SOCIAL_SHARE_CREDIT,
} from "@/lib/referral/config";
import type { PromoShareSubmission } from "@/lib/data/promo-share";

const initialState: PromoShareFormState = {};

type Props = {
  studioUrl: string;
  /** 精選到期時間（ISO），null 表示目前沒有宣傳換來的精選 */
  featuredUntil: string | null;
  visibleOnExplore: boolean;
  submissions: PromoShareSubmission[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
  });
}

export function PromoSharePanel({ studioUrl, featuredUntil, visibleOnExplore, submissions }: Props) {
  const [state, formAction, pending] = useActionState(submitPromoShareProof, initialState);
  const [copied, setCopied] = useState<"link" | "text" | null>(null);

  const shareText = buildStudioShareText({ studioUrl });
  // 伺服器算好的到期時間，跟現在比；精選期間不能再送
  const [renderedAt] = useState(() => Date.now());
  const stillFeatured = featuredUntil ? new Date(featuredUntil).getTime() > renderedAt : false;
  const firstTime = !submissions.some((s) => s.status === "approved" && s.credits_awarded > 0);

  async function copy(text: string, kind: "link" | "text") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="mb-1 text-xl font-bold">我的作品集連結</h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        放在 IG／Threads 自介、報價時用 LINE 傳給客戶，對方點開就看到你全部作品，不用再一支一支傳。
      </p>

      <div className="mb-3 flex flex-col gap-2 rounded-xl border border-[var(--accent-soft)] bg-[var(--bg)] px-4 py-3 sm:flex-row sm:items-center">
        <p className="min-w-0 break-all font-mono text-sm text-[var(--accent)]">{studioUrl}</p>
        <button
          type="button"
          onClick={() => copy(studioUrl, "link")}
          className="btn-primary shrink-0 text-sm sm:ml-auto"
        >
          {copied === "link" ? "已複製" : "複製連結"}
        </button>
      </div>

      <label className="mb-1 block text-sm font-medium">發文範例（可以改成自己的話）</label>
      <textarea readOnly className="input mb-2 min-h-[110px] w-full text-sm leading-relaxed" value={shareText} />
      <button type="button" onClick={() => copy(shareText, "text")} className="btn-secondary mb-5 text-sm">
        {copied === "text" ? "已複製文字" : "複製發文文字"}
      </button>

      <div className="border-t border-[var(--border)] pt-4">
        <h3 className="mb-1 font-bold">發文換首頁精選 {PROMO_FEATURED_DAYS} 天</h3>
        <p className="mb-3 text-sm text-[var(--text-secondary)]">
          在 Threads、IG、Facebook 等發<strong>公開貼文</strong>附上上面的連結，把貼文網址貼過來，
          立刻上首頁精選、探索頁排前面 {PROMO_FEATURED_DAYS} 天
          {firstTime ? `，第一次另給 ${SOCIAL_SHARE_CREDIT} 折抵點` : ""}。到期後可以用新貼文再換一次。
        </p>
        {!visibleOnExplore ? (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            你的工作室還沒出現在探索頁，精選也看不到。先把上面的資料和作品補齊再來換。
          </p>
        ) : null}

        {state.ok && state.message ? (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {state.message}
          </p>
        ) : stillFeatured && featuredUntil ? (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            精選中，到 {formatDate(featuredUntil)} 為止。到期後可以用新貼文再換一次。
          </p>
        ) : (
          <form action={formAction} className="space-y-3">
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            <div>
              <label className="mb-1 block text-sm font-medium">平台</label>
              <select className="input w-full" name="platform" required defaultValue="threads">
                <option value="threads">Threads</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">公開貼文網址</label>
              <input
                className="input w-full"
                name="post_url"
                type="url"
                required
                placeholder="https://www.threads.net/..."
              />
            </div>
            <SubmitButton className="btn-primary text-sm" disabled={pending}>
              {pending ? "送出中…" : "送出，換精選"}
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
