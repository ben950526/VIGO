import Link from "next/link";
import {
  REFERRAL_CREDIT_MAX_BALANCE,
  REFERRAL_CREDIT_PER_SIGNUP,
  SOCIAL_SHARE_CREDIT,
} from "@/lib/referral/config";

type Props = {
  missingStudio: string[];
  hasWork: boolean;
  reviewStatus: "draft" | "pending" | "approved" | "rejected";
  visibleOnExplore: boolean;
  exploreGaps: string[];
};

export function DashboardOnboarding({
  missingStudio,
  hasWork,
  reviewStatus,
  visibleOnExplore,
  exploreGaps,
}: Props) {
  const studioDone = missingStudio.length === 0;
  if (visibleOnExplore) return null;

  return (
    <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="mb-1 text-xl font-bold">現在補齊，發案者才找得到你</h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        目前有發案者在找固定配合的剪輯，人都還沒選定。探索頁只顯示介紹夠、且有已通過作品的工作室。
        {exploreGaps.length > 0 ? ` 你還差：${exploreGaps.join("、")}。` : ""}
        {studioDone && hasWork && reviewStatus !== "approved"
          ? " 資料已齊，通過審核後就會出現。"
          : ""}
      </p>

      <ol className="mb-5 space-y-3 text-sm">
        <li className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <p className="font-medium text-[var(--text)]">
            1. 填工作室 {studioDone ? "（已齊）" : ""}
          </p>
          <p className="mt-1 text-[var(--text-secondary)]">
            介紹、地區、服務、風格、聯絡方式。讓對方一眼看懂你擅長什麼。
          </p>
          {!studioDone ? (
            <p className="mt-1 text-[var(--text-muted)]">還差：{missingStudio.join("、")}</p>
          ) : null}
        </li>
        <li className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <p className="font-medium text-[var(--text)]">
            2. 加作品 {hasWork ? "（已有連結，等審核即可）" : ""}
          </p>
          <p className="mt-1 text-[var(--text-secondary)]">
            貼至少 1 支 YouTube 或 Reels。通過後，探索頁才會顯示你的工作室。
          </p>
        </li>
      </ol>

      <div className="mb-5 text-sm text-[var(--text-secondary)]">
        <p className="font-medium text-[var(--text)]">做完會得到什麼</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            {reviewStatus === "approved"
              ? "工作室已通過審核。"
              : reviewStatus === "rejected"
                ? "上次未通過，改好存檔就會再進審核。"
                : "帳號已在審核中，通過後會寄信通知。"}
          </li>
          <li>發案者可先看作品；真的想合作再敲門，才看得到聯絡方式。</li>
        </ul>
      </div>

      <div className="mb-5 text-sm text-[var(--text-secondary)]">
        <p className="font-medium text-[var(--text)]">額外可累積折抵點（不能換現）</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            把下方邀請碼或連結給同行，對方完成接案者註冊，你拿 {REFERRAL_CREDIT_PER_SIGNUP}{" "}
            點／人。
          </li>
          <li>
            公開貼文介紹 Vigo 並附上邀請連結，送審通過拿 {SOCIAL_SHARE_CREDIT}{" "}
            點（每人一次）。
          </li>
          <li>上限 {REFERRAL_CREDIT_MAX_BALANCE} 點；之後若有訂閱，可依公告折抵月費。</li>
        </ul>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          頁面還空就先發文，點進來的人看不懂。建議先補工作室和作品。
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/studio" className="btn-primary text-sm">
          {studioDone ? "去改工作室" : "去填工作室"}
        </Link>
        <Link href="/dashboard/studio#portfolio" className="btn-secondary text-sm">
          {hasWork ? "再加作品" : "去加第一支作品"}
        </Link>
      </div>
    </div>
  );
}
