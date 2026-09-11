import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">接案者登入</h1>
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          管理你的工作室與作品集
        </p>
        <LoginForm />
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
