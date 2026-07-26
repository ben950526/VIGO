import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/auth/admin";

export async function AdminNavLink() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return null;

  return (
    <Link
      href="/admin/review"
      className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
    >
      審核管理
    </Link>
  );
}
