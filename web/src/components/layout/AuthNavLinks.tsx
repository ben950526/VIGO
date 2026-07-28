import Link from "next/link";
import { signOut } from "@/actions/auth";
import { getNavAuth } from "@/lib/auth/nav";
import { isSupabaseConfigured } from "@/lib/utils";
import { SubmitButton } from "@/components/forms/SubmitButton";

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

  const { isLoggedIn, isAdmin } = await getNavAuth();

  if (!isLoggedIn) {
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
      {isAdmin && (
        <Link
          href="/admin/review"
          className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
        >
          審核管理
        </Link>
      )}
      <form action={signOut}>
        <SubmitButton className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
          登出
        </SubmitButton>
      </form>
    </>
  );
}
