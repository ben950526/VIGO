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
import type { PendingCreator } from "@/lib/data/admin";

export function PendingCreatorCard({ creator }: { creator: PendingCreator }) {
  const [removed, setRemoved] = useState(false);
  if (removed) return null;

  function onDone() {
    setRemoved(true);
  }

  return (
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">{creator.studio_name}</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {creator.contact_email} · {creator.region ?? "未填地區"} · slug: {creator.slug}
          </p>
          {creator.bio && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{creator.bio}</p>
          )}
          <p className="mt-2 text-sm">
            待審作品：{" "}
            {creator.portfolio_items.filter((p) => p.status === "pending").length} 件
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminActionForm
            action={approveCreatorAndWorks}
            id={creator.id}
            className="btn-primary text-sm"
            removeOnSuccess={false}
            onDone={onDone}
          >
            通過（含全部作品）
          </AdminActionForm>
          <AdminActionForm
            action={approveCreator}
            id={creator.id}
            className="btn-secondary text-sm"
            removeOnSuccess={false}
            onDone={onDone}
          >
            僅通過創作者
          </AdminActionForm>
          <AdminActionForm
            action={rejectCreator}
            id={creator.id}
            className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            pendingText="退件中…"
            removeOnSuccess={false}
            onDone={onDone}
          >
            退件
          </AdminActionForm>
        </div>
      </div>

      {creator.portfolio_items.length > 0 && (
        <ul className="space-y-2 border-t border-[var(--border)] pt-4">
          {creator.portfolio_items.map((item) => (
            <PendingPortfolioLine key={item.id} itemId={item.id} title={item.title} status={item.status} />
          ))}
        </ul>
      )}
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
        {title} <span className="text-[var(--text-muted)]">({status})</span>
      </span>
      {status === "pending" && (
        <div className="flex gap-2">
          <AdminActionForm
            action={approvePortfolioItem}
            id={itemId}
            className="text-[var(--accent)] hover:underline"
            removeOnSuccess={false}
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
            onDone={() => setRemoved(true)}
          >
            退件
          </AdminActionForm>
        </div>
      )}
    </li>
  );
}
