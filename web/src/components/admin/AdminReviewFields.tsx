import type { ReactNode } from "react";

export function AdminReviewField({
  label,
  value,
  empty = "未填",
}: {
  label: string;
  value: string | null | undefined;
  empty?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-sm text-[var(--text)]">{value?.trim() ? value : empty}</p>
    </div>
  );
}

export function AdminReviewTagList({
  label,
  tags,
}: {
  label: string;
  tags: string[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">{label}</p>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="tag text-xs">
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">未填</p>
      )}
    </div>
  );
}

export function AdminReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[var(--border)] pt-4">
      <h4 className="mb-3 text-sm font-bold text-[var(--text)]">{title}</h4>
      {children}
    </section>
  );
}
