import Link from "next/link";
import { signOut } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import { AdminNavLink } from "@/components/layout/AdminNavLink";

export async function AuthNavLinks() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <Link href="/register" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]">
          接案者加入
        </Link>
        <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]">
          登入
        </Link>
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Link href="/register" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]">
          接案者加入
        </Link>
        <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]">
          登入
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
        我的工作室
      </Link>
      <AdminNavLink />
      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
        >
          登出
        </button>
      </form>
    </>
  );
}
