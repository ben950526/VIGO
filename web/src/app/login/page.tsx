import { Suspense } from "react";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/forms/GoogleSignInButton";
import { LoginForm } from "@/components/forms/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string; reset?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">接案者登入</h1>
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          管理你的工作室與作品集
        </p>
        {params.registered === "1" ? (
          <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            帳號已建立，註冊信也會寄到你的 Email。請登入，接下來只要補工作室和作品，發案者才找得到你。
          </p>
        ) : null}
        {params.reset === "1" ? (
          <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            密碼已更新，請用新密碼登入。
          </p>
        ) : null}
        {params.error === "auth" ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            登入連結無效或已過期，請重新登入或再申請一次忘記密碼。
          </p>
        ) : null}
        <GoogleSignInButton as="creator_login" next={params.next ?? "/dashboard"} />
        <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
          用 Gmail 註冊過的帳號，按這裡就會回到原本的工作室。
        </p>

        <div className="my-6 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          或用 Email＋密碼登入
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm">
          還沒有帳號？{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            免費註冊
          </Link>
        </p>
      </div>
    </section>
  );
}
