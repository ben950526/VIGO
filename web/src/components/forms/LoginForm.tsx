"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth/errors";
import { isSupabaseConfigured } from "@/lib/utils";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("請先設定 Supabase 環境變數（見 .env.example）");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(formatAuthError(signInError.message));
        setPending(false);
        return;
      }

      window.location.assign(safeNextPath(searchParams.get("next")));
    } catch (err) {
      const message = err instanceof Error ? err.message : "登入失敗，請稍後再試";
      setError(formatAuthError(message));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input className="input" name="email" type="email" placeholder="Email" required autoComplete="email" />
      <input
        className="input"
        name="password"
        type="password"
        placeholder="密碼"
        required
        autoComplete="current-password"
      />
      <p className="text-right text-sm">
        <Link href="/forgot-password" className="text-[var(--accent)] hover:underline">
          忘記密碼？
        </Link>
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70">
        {pending ? "登入中…" : "登入"}
      </button>
    </form>
  );
}
