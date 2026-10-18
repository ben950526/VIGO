import Link from "next/link";
import {
  EXPLORE_UNBLOCK_FOCUS_LIMIT,
  EXPLORE_VISIBLE_TARGET,
  compareExploreUnblockKind,
  exploreUnblockKind,
  exploreUnblockKindLabel,
  isReadyForPriorityReview,
  studioExploreContentGaps,
} from "@/lib/creator/listing";
import type { PendingCreator, PublishedCreator } from "@/lib/data/admin";

type ExploreUnblockQueueProps = {
  pendingCreators: PendingCreator[];
  publishedCreators: PublishedCreator[];
};

export function ExploreUnblockQueue({
  pendingCreators,
  publishedCreators,
}: ExploreUnblockQueueProps) {
  const priorityReview = pendingCreators.filter((creator) =>
    isReadyForPriorityReview({
      bio: creator.bio,
      portfolio_items: creator.portfolio_items,
    }),
  );

  const approvedIncomplete = publishedCreators
    .filter((creator) => {
      if (creator.is_listed === false) return false;
      return studioExploreContentGaps(creator).length > 0;
    })
    .map((creator) => {
      const kind = exploreUnblockKind(creator) ?? "both";
      return {
        creator,
        kind,
        gaps: studioExploreContentGaps(creator),
      };
    })
    .sort((a, b) => compareExploreUnblockKind(a.kind, b.kind));

  const visibleCount = publishedCreators.filter(
    (creator) =>
      creator.is_listed !== false && studioExploreContentGaps(creator).length === 0,
  ).length;

  const stillNeeded = Math.max(0, EXPLORE_VISIBLE_TARGET - visibleCount);
  const focus = approvedIncomplete.slice(0, EXPLORE_UNBLOCK_FOCUS_LIMIT);
  const restCount = Math.max(0, approvedIncomplete.length - focus.length);
  const bioOnlyCount = approvedIncomplete.filter((row) => row.kind === "bio_only").length;
  const workOnlyCount = approvedIncomplete.filter((row) => row.kind === "work_only").length;

  return (
    <div className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="mb-1 text-xl font-bold">本週手段：把人送上探索頁</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        探索頁目前 {visibleCount} 間，目標約 {EXPLORE_VISIBLE_TARGET} 間
        {stillNeeded > 0 ? `，再 ${stillNeeded} 間就夠。` : "，已達標。"}
        只處理最接近的 {EXPLORE_UNBLOCK_FOCUS_LIMIT} 間；其餘空殼等對方登入後台黃字即可，不要逐封私訊。
      </p>

      <div className="mb-6">
        <h3 className="text-sm font-semibold">優先審核（過了就能上探索頁）· {priorityReview.length}</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          介紹已夠、且已有待審或已通過作品。請先看這批。空殼可以過，但過審信會寫清楚還不會出現在探索頁。
        </p>
        {priorityReview.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">目前沒有這種待審。</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {priorityReview.map((creator) => (
              <li key={creator.id}>
                <Link href={`/creator/${creator.slug}`} className="text-[var(--accent)] hover:underline">
                  {creator.studio_name}
                </Link>
                <span className="text-[var(--text-muted)]"> · {creator.verification_status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold">
          這週先找這 {focus.length} 間 · 已通過但探索頁還看不見共 {approvedIncomplete.length}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          只差介紹 {bioOnlyCount} · 只差作品 {workOnlyCount} · 兩項都缺{" "}
          {approvedIncomplete.length - bioOnlyCount - workOnlyCount}
          。排序：只差介紹 → 只差作品 → 兩項都缺。私訊時直接說差哪一項、補了不必再審。
        </p>
        {approvedIncomplete.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">沒有這種工作室。</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {focus.map(({ creator, kind, gaps }) => (
              <li key={creator.id}>
                <Link href={`/creator/${creator.slug}`} className="text-[var(--accent)] hover:underline">
                  {creator.studio_name}
                </Link>
                <span className="text-[var(--text-muted)]">
                  {" "}
                  · {exploreUnblockKindLabel(kind)} · 請補 {gaps.join("、")}
                  {creator.contact_email ? ` · ${creator.contact_email}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        {restCount > 0 ? (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            另外 {restCount} 間兩項都還沒齊，先不列。對方登入後台會看到黃字。
          </p>
        ) : null}
      </div>
    </div>
  );
}
