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
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          先建立帳號，接著填齊工作室資料再送審。作品集可以之後再慢慢補。初期全免費。
        </p>
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
