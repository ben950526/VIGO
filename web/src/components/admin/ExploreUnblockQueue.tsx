import Link from "next/link";
import {
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

  const approvedIncomplete = publishedCreators.filter((creator) => {
    if (creator.is_listed === false) return false;
    return studioExploreContentGaps(creator).length > 0;
  });

  const visibleCount = publishedCreators.filter(
    (creator) =>
      creator.is_listed !== false && studioExploreContentGaps(creator).length === 0,
  ).length;

  return (
    <div className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="mb-1 text-xl font-bold">本週手段：把人送上探索頁</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        探索頁目前 {visibleCount} 間。目標先到約 30 間。下面兩份名單請當天處理；發案文請連到探索頁請對方敲門，不要只在站外配對。
      </p>

      <div className="mb-6">
        <h3 className="text-sm font-semibold">優先審核（介紹已齊、已有作品）· {priorityReview.length}</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          過了就能出現在探索頁。請先看這批，再看其他待審。
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
          已通過但探索頁還看不見 · {approvedIncomplete.length}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          昨天已寄過完善信。這週若還在這份名單，再私訊一次即可，先不要再群發。
        </p>
        {approvedIncomplete.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">沒有這種工作室。</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {approvedIncomplete.map((creator) => (
              <li key={creator.id}>
                <Link href={`/creator/${creator.slug}`} className="text-[var(--accent)] hover:underline">
                  {creator.studio_name}
                </Link>
                <span className="text-[var(--text-muted)]">
                  {" "}
                  · 請補 {studioExploreContentGaps(creator).join("、")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}