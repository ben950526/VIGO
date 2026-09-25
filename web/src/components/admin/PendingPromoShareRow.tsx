import {
  approvePromoShareSubmission,
  rejectPromoShareSubmission,
} from "@/actions/promo-share";
import { SubmitButton } from "@/components/forms/SubmitButton";
import type { PromoShareSubmissionWithCreator } from "@/lib/data/promo-share";
import { SOCIAL_SHARE_CREDIT } from "@/lib/referral/config";

const PLATFORM_LABEL: Record<string, string> = {
  threads: "Threads",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  other: "其他",
};

export function PendingPromoShareRow({ item }: { item: PromoShareSubmissionWithCreator }) {
  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="font-medium">
        {item.studio_name}{" "}
        <span className="text-sm font-normal text-[var(--text-muted)]">
          · {PLATFORM_LABEL[item.platform] ?? item.platform}
        </span>
      </p>
      <p className="mt-1 text-sm">
        <a href={item.post_url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
          {item.post_url}
        </a>
      </p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        通過後 +{SOCIAL_SHARE_CREDIT} 點（若已達上限 300 則發 0 點）· 送審 {item.created_at.slice(0, 10)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={approvePromoShareSubmission}>
          <input type="hidden" name="id" value={item.id} />
          <SubmitButton className="btn-primary text-sm">通過並發點</SubmitButton>
        </form>
        <form action={rejectPromoShareSubmission} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <input
            className="input text-sm"
            name="admin_note"
            placeholder="拒絕原因（選填）"
            aria-label="拒絕原因"
          />
          <SubmitButton className="btn-secondary text-sm">拒絕</SubmitButton>
        </form>
      </div>
    </li>
  );
}
