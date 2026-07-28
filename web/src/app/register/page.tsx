"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError("");
    try {
      const result = await signUp(formData);
      if (result?.error) setError(result.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">接案者加入 Vigo</h1>
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          建立工作室頁，被動等發案者找上門。初期全免費。
        </p>
        <form action={handleSubmit} className="space-y-4">
          <input className="input" name="real_name" placeholder="真實姓名（實名驗證用）" required />
          <input className="input" name="studio_name" placeholder="工作室名稱" required />
          <input className="input" name="email" type="email" placeholder="Email" required />
          <input className="input" name="password" type="password" placeholder="密碼（至少 6 碼）" minLength={6} required />
          <label className="flex items-start gap-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            <input
              type="checkbox"
              name="accept_terms"
              value="yes"
              required
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
            />
            <span>
              我已年滿 18 歲（或具完全行為能力），並已閱讀且同意{" "}
              <Link href="/terms" target="_blank" className="text-[var(--accent)] hover:underline">
                使用條款
              </Link>{" "}
              與{" "}
              <Link href="/privacy" target="_blank" className="text-[var(--accent)] hover:underline">
                隱私權政策
              </Link>
              。
            </span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70">
            {pending ? "建立中…" : "建立帳號"}
          </button>
        </form>
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
