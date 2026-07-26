import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { AuthNavLinks } from "@/components/layout/AuthNavLinks";

const links = [
  { href: "/", label: "首頁" },
  { href: "/explore", label: "探索創作者" },
];

export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-[var(--border)] bg-[rgba(255,255,255,0.97)] px-6 py-4 md:px-12">
      <Link href="/" className="text-lg font-bold text-[var(--text)]">
        {SITE_NAME}
      </Link>
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
          >
            {link.label}
          </Link>
        ))}
        <AuthNavLinks />
      </div>
    </nav>
  );
}
