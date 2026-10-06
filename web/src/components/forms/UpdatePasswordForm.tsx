"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth/errors";
import { isSupabaseConfigured } from "@/lib/utils";

export function UpdatePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("請先設定 Supabase 環境變數（見 .env.example）");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    if (password.length < 6) {
      setError("密碼至少 6 碼");
      return;
    }
    if (password !== confirm) {
      setError("兩次輸入的密碼不一致");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setError("重設連結無效或已過期，請重新申請");
        setPending(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(formatAuthError(updateError.message));
        setPending(false);
        return;
      }

      await supabase.auth.signOut();
      window.location.replace("/login?reset=1");
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新失敗，請稍後再試";
      setError(formatAuthError(message));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="input"
        name="password"
        type="password"
        placeholder="新密碼（至少 6 碼）"
        minLength={6}
        required
        autoComplete="new-password"
      />
      <input
        className="input"
        name="confirm"
        type="password"
        placeholder="再輸入一次新密碼"
        minLength={6}
        required
        autoComplete="new-password"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70">
        {pending ? "更新中…" : "設定新密碼"}
      </button>
    </form>
  );
}
