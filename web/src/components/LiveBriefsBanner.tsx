import Link from "next/link";
import {
  LIVE_BRIEFS,
  LIVE_BRIEFS_CLIENT_HINT,
  LIVE_BRIEFS_CREATOR_HINT,
  getLiveBriefsBannerTitle,
} from "@/lib/live-briefs";

type LiveBriefsBannerProps = {
  audience: "client" | "creator";
};

export function LiveBriefsBanner({ audience }: LiveBriefsBannerProps) {
  const hint = audience === "client" ? LIVE_BRIEFS_CLIENT_HINT : LIVE_BRIEFS_CREATOR_HINT;
  const cta =
    audience === "client" ? (
      <p className="text-sm text-[var(--text-secondary)]">{hint}</p>
    ) : (
      <p className="text-sm text-[var(--text-secondary)]">
        {hint}{" "}
        <Link href="/dashboard/studio" className="text-[var(--accent)] hover:underline">
          去補齊工作室
        </Link>
      </p>
    );

  return (
    <div className="mb-8 rounded-2xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-5 py-4">
      <p className="font-semibold text-[var(--text)]">{getLiveBriefsBannerTitle(audience)}</p>
      {LIVE_BRIEFS.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
          {LIVE_BRIEFS.map((brief) => (
            <li key={brief.id}>
              <strong className="text-[var(--text)]">{brief.title}</strong>
              {" · "}
              {brief.detail}
            </li>
          ))}
        </ul>
      ) : null}
      <div className={LIVE_BRIEFS.length > 0 ? "mt-3" : "mt-2"}>{cta}</div>
    </div>
  );
}
