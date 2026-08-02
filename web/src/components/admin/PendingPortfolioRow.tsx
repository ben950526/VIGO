"use client";

import { useState } from "react";
import Link from "next/link";
import { approvePortfolioItem, rejectPortfolioItem } from "@/actions/admin";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminReviewTagList } from "@/components/admin/AdminReviewFields";
import { AdminPortfolioPreview } from "@/components/admin/AdminPortfolioPreview";
import type { PortfolioItem, CreatorProfile } from "@/types/database";

interface PendingPortfolioRowProps {
  item: PortfolioItem & { creator: Pick<CreatorProfile, "studio_name" | "slug"> };
}

export function PendingPortfolioRow({ item }: PendingPortfolioRowProps) {
  const [removed, setRemoved] = useState(false);
  if (removed) return null;

  return (
    <li className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{item.title}</p>
          <p className="text-sm text-[var(--text-muted)]">
            {item.creator.studio_name} ·{" "}
            <Link
              href={`/creator/${item.creator.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              /creator/{item.creator.slug}
            </Link>
          </p>
          {item.description?.trim() && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.description}</p>
          )}
          {item.style_tags.length > 0 && (
            <div className="mt-3">
              <AdminReviewTagList label="作品標籤" tags={item.style_tags} />
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <AdminActionForm
            action={approvePortfolioItem}
            id={item.id}
            className="btn-primary text-sm"
            removeOnSuccess={false}
            skipRefresh
            onDone={() => setRemoved(true)}
          >
            通過
          </AdminActionForm>
          <AdminActionForm
            action={rejectPortfolioItem}
            id={item.id}
            className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600"
            pendingText="退件中…"
            removeOnSuccess={false}
            skipRefresh
            onDone={() => setRemoved(true)}
          >
            退件
          </AdminActionForm>
        </div>
      </div>
      <AdminPortfolioPreview
        title={item.title}
        embedUrl={item.embed_url}
        embedType={item.embed_type}
        thumbnailUrl={item.thumbnail_url}
        creatorSlug={item.creator.slug}
      />
    </li>
  );
}
