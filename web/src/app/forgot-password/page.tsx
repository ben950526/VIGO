import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata = {
  title: "忘記密碼",
};

export default function ForgotPasswordPage() {
  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">忘記密碼</h1>
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          輸入註冊 Email，我們會寄重設連結。
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            返回登入
          </Link>
        </p>
      </div>
    </section>
  );
}
