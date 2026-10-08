import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/forms/RegisterForm";

function RegisterFormFallback() {
  return <p className="text-center text-sm text-[var(--text-muted)]">載入表單…</p>;
}

export default function RegisterPage() {
  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">接案者加入 Vigo</h1>
        <p className="mb-4 text-center text-[var(--text-secondary)]">
          免費加入。註冊後登入，依序補資料即可。
        </p>
        <ol className="mb-8 space-y-1 text-left text-sm text-[var(--text-secondary)]">
          <li>1. 填工作室介紹、地區、服務、聯絡方式</li>
          <li>2. 貼至少 1 支 YouTube／Reels</li>
          <li>3. 審核通過後出現在探索頁；邀請同行還可累積折抵點（不能換現）</li>
        </ol>
        <Suspense fallback={<RegisterFormFallback />}>
          <RegisterForm />
        </Suspense>
        <p className="mt-6 text-center text-sm">
          已有帳號？{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            登入
          </Link>
        </p>
      </div>
    </section>
  );
}
