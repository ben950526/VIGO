import Link from "next/link";
import {
  LIVE_BRIEFS,
  LIVE_BRIEFS_CLIENT_HINT,
  LIVE_BRIEFS_CREATOR_HINT,
  LIVE_BRIEFS_HEADLINE,
} from "@/lib/live-briefs";

type LiveBriefsBannerProps = {
  audience: "client" | "creator";
};

export function LiveBriefsBanner({ audience }: LiveBriefsBannerProps) {
  const hint = audience === "client" ? LIVE_BRIEFS_CLIENT_HINT : LIVE_BRIEFS_CREATOR_HINT;
  const cta =
    audience === "client" ? (
      <p className="mt-3 text-sm text-[var(--text-secondary)]">{hint}</p>
    ) : (
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {hint}{" "}
        <Link href="/dashboard/studio" className="text-[var(--accent)] hover:underline">
          去補齊工作室
        </Link>
      </p>
    );

  return (
    <div className="mb-8 rounded-2xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-5 py-4">
      <p className="font-semibold text-[var(--text)]">{LIVE_BRIEFS_HEADLINE}</p>
      <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
        {LIVE_BRIEFS.map((brief) => (
          <li key={brief.id}>
            <strong className="text-[var(--text)]">
              {brief.client}｜{brief.title}
            </strong>
            {" · "}
            {brief.detail}
          </li>
        ))}
      </ul>
      {cta}
    </div>
  );
}