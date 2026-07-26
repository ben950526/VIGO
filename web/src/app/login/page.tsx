"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    const result = await signIn(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">接案者登入</h1>
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          管理你的工作室與作品集
        </p>
        <form action={handleSubmit} className="space-y-4">
          <input className="input" name="email" type="email" placeholder="Email" required />
          <input className="input" name="password" type="password" placeholder="密碼" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full">
            登入
          </button>
        </form>
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
