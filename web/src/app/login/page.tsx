import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string }>;
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
            帳號已建立。請用剛才的 Email 與密碼登入（不必再註冊一次）。
          </p>
        ) : null}
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
