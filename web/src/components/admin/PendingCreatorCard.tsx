"use client";

import { useState } from "react";
import {
  approveCreator,
  approveCreatorAndWorks,
  approvePortfolioItem,
  rejectCreator,
  rejectPortfolioItem,
} from "@/actions/admin";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPendingCreatorPreview } from "@/components/admin/AdminPendingCreatorPreview";
import type { PendingCreator } from "@/lib/data/admin";

function ReviewActions({
  creatorId,
  onDone,
}: {
  creatorId: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <AdminActionForm
        action={approveCreatorAndWorks}
        id={creatorId}
        className="btn-primary text-sm"
        removeOnSuccess={false}
        skipRefresh
        onDone={onDone}
      >
        通過（含全部作品）
      </AdminActionForm>
      <AdminActionForm
        action={approveCreator}
        id={creatorId}
        className="btn-secondary text-sm"
        removeOnSuccess={false}
        skipRefresh
        onDone={onDone}
      >
        僅通過創作者
      </AdminActionForm>
      <AdminActionForm
        action={rejectCreator}
        id={creatorId}
        className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        pendingText="退件中…"
        removeOnSuccess={false}
        skipRefresh
        onDone={onDone}
      >
        退件
      </AdminActionForm>
    </div>
  );
}

export function PendingCreatorCard({ creator }: { creator: PendingCreator }) {
  const [removed, setRemoved] = useState(false);
  if (removed) return null;

  const pendingCount = creator.portfolio_items.filter((p) => p.status === "pending").length;

  function onDone() {
    setRemoved(true);
  }

  return (
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h3 className="text-xl font-bold">{creator.studio_name}</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {creator.contact_email ?? "未填 Email"} · slug: {creator.slug}
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            待審作品 {pendingCount} 件 · 共 {creator.portfolio_items.length} 件
          </p>
        </div>
        <ReviewActions creatorId={creator.id} onDone={onDone} />
      </div>

      <AdminPendingCreatorPreview creator={creator} />

      {creator.portfolio_items.some((item) => item.status === "pending") && (
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <p className="mb-3 text-sm font-medium text-[var(--text)]">個別審核作品</p>
          <ul className="space-y-2">
            {creator.portfolio_items.map((item) => (
              <PendingPortfolioLine
                key={item.id}
                itemId={item.id}
                title={item.title}
                status={item.status}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
        <ReviewActions creatorId={creator.id} onDone={onDone} />
      </div>
    </li>
  );
}

function PendingPortfolioLine({
  itemId,
  title,
  status,
}: {
  itemId: string;
  title: string;
  status: string;
}) {
  const [removed, setRemoved] = useState(false);
  if (removed) return null;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>
        {title}{" "}
        <span className="text-[var(--text-muted)]">({status})</span>
      </span>
      {status === "pending" && (
        <div className="flex gap-2">
          <AdminActionForm
            action={approvePortfolioItem}
            id={itemId}
            className="text-[var(--accent)] hover:underline"
            removeOnSuccess={false}
            skipRefresh
            onDone={() => setRemoved(true)}
          >
            通過作品
          </AdminActionForm>
          <AdminActionForm
            action={rejectPortfolioItem}
            id={itemId}
            className="text-red-600 hover:underline"
            pendingText="退件中…"
            removeOnSuccess={false}
            skipRefresh
            onDone={() => setRemoved(true)}
          >
            退件
          </AdminActionForm>
        </div>
      )}
    </li>
  );
}
