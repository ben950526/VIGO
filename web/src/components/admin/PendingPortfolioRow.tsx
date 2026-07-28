"use client";

import { useState } from "react";
import { approvePortfolioItem, rejectPortfolioItem } from "@/actions/admin";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import type { PortfolioItem, CreatorProfile } from "@/types/database";

interface PendingPortfolioRowProps {
  item: PortfolioItem & { creator: Pick<CreatorProfile, "studio_name" | "slug"> };
}

export function PendingPortfolioRow({ item }: PendingPortfolioRowProps) {
  const [removed, setRemoved] = useState(false);
  if (removed) return null;

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div>
        <p className="font-medium">{item.title}</p>
        <p className="text-sm text-[var(--text-muted)]">
          {item.creator.studio_name} · /creator/{item.creator.slug}
        </p>
        <a
          href={item.embed_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          預覽連結
        </a>
      </div>
      <div className="flex gap-2">
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
    </li>
  );
}
