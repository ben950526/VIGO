import Link from "next/link";
import { SignOutButton } from "@/components/forms/SignOutButton";
import { getNavAuth } from "@/lib/auth/nav";
import { isSupabaseConfigured } from "@/lib/utils";

export async function AuthNavLinks() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <a href="/register" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]">
          接案者加入
        </a>
        <a href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]">
          登入
        </a>
      </>
    );
  }

  const { isLoggedIn, isAdmin } = await getNavAuth();

  if (!isLoggedIn) {
    return (
      <>
        <a href="/register" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]">
          接案者加入
        </a>
        <a href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]">
          登入
        </a>
      </>
    );
  }

  return (
    <>
      <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
        我的工作室
      </Link>
      {isAdmin && (
        <Link
          href="/admin/review"
          className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
        >
          審核管理
        </Link>
      )}
      <SignOutButton className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
        登出
      </SignOutButton>
    </>
  );
}
