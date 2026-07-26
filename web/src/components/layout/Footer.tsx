import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--border)] py-10 text-center text-sm text-[var(--text-muted)]">
      <p>
        <Link href="/feedback" className="text-[var(--accent)] hover:underline">
          意見回饋
        </Link>
        <span className="mx-2">·</span>
        <Link href="/report-bug" className="text-[var(--accent)] hover:underline">
          回報 BUG
        </Link>
      </p>
      <p className="mt-1 text-xs">建議我們會高度採納 · BUG 我們會專人排查修復</p>
      <p className="mt-2">© {new Date().getFullYear()} {SITE_NAME} · 短影音接案媒合平台</p>
    </footer>
  );
}
