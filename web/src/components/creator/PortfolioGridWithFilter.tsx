"use client";

import { useMemo, useState } from "react";
import { PortfolioGrid } from "@/components/creator/PortfolioGrid";
import { STYLE_TAGS } from "@/lib/constants";
import type { PortfolioItem } from "@/types/database";

interface PortfolioGridWithFilterProps {
  items: PortfolioItem[];
}

function getAvailableTags(items: PortfolioItem[]): string[] {
  const tagSet = new Set<string>();
  for (const item of items) {
    for (const tag of item.style_tags) tagSet.add(tag);
  }

  const ordered = STYLE_TAGS.filter((tag) => tagSet.has(tag));
  const custom = [...tagSet]
    .filter((tag) => !(STYLE_TAGS as readonly string[]).includes(tag))
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));

  return [...ordered, ...custom];
}

export function PortfolioGridWithFilter({ items }: PortfolioGridWithFilterProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const availableTags = useMemo(() => getAvailableTags(items), [items]);

  const filteredItems = useMemo(() => {
    if (!selectedTag) return items;
    return items.filter((item) => item.style_tags.includes(selectedTag));
  }, [items, selectedTag]);

  const showFilter = availableTags.length >= 2;

  return (
    <div className="space-y-8">
      {showFilter && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
          <p className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
            依作品風格篩選
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedTag === null
                  ? "bg-[var(--btn)] text-white"
                  : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
              }`}
            >
              全部 ({items.length})
            </button>
            {availableTags.map((tag) => {
              const count = items.filter((item) => item.style_tags.includes(tag)).length;
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(active ? null : tag)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--btn)] text-white"
                      : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                  }`}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <p className="text-center text-[var(--text-muted)]">
          此風格目前沒有作品
        </p>
      ) : (
        <PortfolioGrid items={filteredItems} />
      )}
    </div>
  );
}
