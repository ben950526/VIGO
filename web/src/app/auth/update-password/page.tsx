import Link from "next/link";
import { UpdatePasswordForm } from "@/components/forms/UpdatePasswordForm";

export const metadata = {
  title: "設定新密碼",
};

export default function UpdatePasswordPage() {
  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">設定新密碼</h1>
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          請輸入新密碼後即可登入。若連結已過期，請重新申請忘記密碼。
        </p>
        <UpdatePasswordForm />
        <p className="mt-6 text-center text-sm">
          <Link href="/forgot-password" className="text-[var(--accent)] hover:underline">
            重新申請重設連結
          </Link>
        </p>
      </div>
    </section>
  );
}
