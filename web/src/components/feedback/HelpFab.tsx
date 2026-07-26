"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const hiddenPrefixes = [
  "/feedback",
  "/report-bug",
  "/dashboard",
  "/admin",
  "/login",
  "/signup",
];

export function HelpFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const page = encodeURIComponent(pathname);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open && (
        <>
          <Link
            href={`/report-bug?page=${page}`}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium shadow-md hover:border-[var(--accent)]"
            onClick={() => setOpen(false)}
          >
            回報 BUG
          </Link>
          <Link
            href={`/feedback?page=${page}`}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium shadow-md hover:border-[var(--accent)]"
            onClick={() => setOpen(false)}
          >
            給建議
          </Link>
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-[var(--btn)] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-[var(--btn-hover)]"
        aria-expanded={open}
      >
        {open ? "關閉" : "需要協助？"}
      </button>
    </div>
  );
}
