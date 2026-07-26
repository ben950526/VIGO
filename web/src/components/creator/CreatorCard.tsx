import Link from "next/link";
import type { CreatorProfile } from "@/types/database";
import { CreatorAvatar } from "@/components/creator/CreatorAvatar";
import { DemoBadge } from "@/components/creator/DemoBadge";
import { isDemoCreator } from "@/lib/demo-creator";
import { formatPriceRange } from "@/lib/utils";

interface CreatorCardProps {
  creator: CreatorProfile;
  compact?: boolean;
}

export function CreatorCard({ creator, compact = false }: CreatorCardProps) {
  const price =
    isDemoCreator(creator) ? null : formatPriceRange(creator.price_min, creator.price_max);

  return (
    <Link
      href={`/creator/${creator.slug}`}
      className={`card w-full ${compact ? "" : "mx-auto max-w-[340px]"}`}
    >
      <div
        className={`relative w-full overflow-hidden ${
          compact ? "aspect-square" : "aspect-[4/3]"
        }`}
      >
        <CreatorAvatar name={creator.studio_name} avatarUrl={creator.avatar_url} />
        <div className="absolute left-2 top-2">
          <DemoBadge creator={creator} />
        </div>
      </div>

      <div className={compact ? "p-3 text-center" : "p-5 text-center"}>
        <h3
          className={`mb-0.5 font-bold text-[var(--text)] ${
            compact ? "line-clamp-1 text-sm" : "text-xl"
          }`}
        >
          {creator.studio_name}
        </h3>
        {!compact && <DemoBadge creator={creator} className="mb-2" />}

        <p className={`text-[var(--accent)] ${compact ? "mb-1 text-xs" : "mb-3 text-sm"}`}>
          {creator.region ?? "台灣"}
        </p>

        {!compact && price && (
          <p className="mb-2 text-sm text-[var(--text-muted)]">{price}</p>
        )}

        <div className="flex flex-wrap justify-center gap-1.5">
          {creator.style_tags.slice(0, compact ? 2 : 3).map((tag) => (
            <span key={tag} className={`tag ${compact ? "px-2 py-0.5 text-xs" : ""}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
