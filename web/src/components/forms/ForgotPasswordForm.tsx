"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth/errors";
import { isSupabaseConfigured } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("請先設定 Supabase 環境變數（見 .env.example）");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    if (!email) {
      setError("請填寫 Email");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        setError(formatAuthError(resetError.message));
        setPending(false);
        return;
      }

      setSent(true);
      setPending(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "寄送失敗，請稍後再試";
      setError(formatAuthError(message));
      setPending(false);
    }
  }

  if (sent) {
    return (
      <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        若此 Email 已註冊，我們已寄出重設密碼連結。請到收件匣（含垃圾郵件）點選連結。連結有時效，過期請再申請一次。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="input"
        name="email"
        type="email"
        placeholder="註冊時使用的 Email"
        required
        autoComplete="email"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70">
        {pending ? "寄送中…" : "寄出重設連結"}
      </button>
    </form>
  );
}
