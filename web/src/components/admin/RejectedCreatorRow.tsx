"use client";

import { AdminPurgeAccountForm } from "@/components/admin/AdminPurgeAccountForm";
import type { RejectedCreator } from "@/lib/data/admin";

export function RejectedCreatorRow({ creator }: { creator: RejectedCreator }) {
  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <p className="font-medium">{creator.studio_name}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {creator.contact_email ?? "未填 Email"} · slug: {creator.slug}
      </p>
      <AdminPurgeAccountForm
        creatorId={creator.id}
        slug={creator.slug}
        studioName={creator.studio_name}
      />
    </li>
  );
}
