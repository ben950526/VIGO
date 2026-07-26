import { DEMO_BADGE_LABEL, isDemoCreator } from "@/lib/demo-creator";
import type { CreatorProfile } from "@/types/database";

interface DemoBadgeProps {
  creator: Pick<CreatorProfile, "is_demo" | "slug">;
  className?: string;
}

export function DemoBadge({ creator, className = "" }: DemoBadgeProps) {
  if (!isDemoCreator(creator)) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-300 ${className}`}
    >
      {DEMO_BADGE_LABEL}
    </span>
  );
}
