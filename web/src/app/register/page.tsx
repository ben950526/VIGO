import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">接案者加入 Vigo</h1>
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          建立工作室頁，被動等發案者找上門。初期全免費。
        </p>
        <RegisterForm />
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
