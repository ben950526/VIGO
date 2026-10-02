"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth/errors";
import { TERMS_VERSION } from "@/lib/legal";
import { createCreatorSlug, isSupabaseConfigured } from "@/lib/utils";

const REF_STORAGE_KEY = "vigo_referral_ref";

function withTimeout<T>(promise: Promise<T>, ms: number, code: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(code)), ms);
    }),
  ]);
}

export function RegisterForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingLabel, setPendingLabel] = useState("建立中…");
  const [referrerRef, setReferrerRef] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("ref")?.trim();
    if (fromUrl) {
      sessionStorage.setItem(REF_STORAGE_KEY, fromUrl);
      setReferrerRef(fromUrl);
      return;
    }
    const stored = sessionStorage.getItem(REF_STORAGE_KEY)?.trim();
    if (stored) setReferrerRef(stored);
  }, [searchParams]);

  function updateReferrerRef(value: string) {
    const trimmed = value.trim();
    setReferrerRef(value);
    if (trimmed) sessionStorage.setItem(REF_STORAGE_KEY, trimmed);
    else sessionStorage.removeItem(REF_STORAGE_KEY);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("請先設定 Supabase 環境變數（見 .env.example）");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const realName = String(formData.get("real_name") ?? "").trim();
    const studioName = String(formData.get("studio_name") ?? "").trim();

    if (!email || !password || !realName || !studioName) {
      setError("請填寫所有必填欄位");
      return;
    }

    if (formData.get("accept_terms") !== "yes") {
      setError("請先閱讀並同意使用條款與隱私權政策");
      return;
    }

    setPending(true);
    setPendingLabel("正在建立登入帳號…");
    setError(null);

    const watchdog = window.setTimeout(() => {
      setPending(false);
      setError("超過 8 秒沒回應。請不要再按建立，改走「登入」——帳號多半已經建好。");
    }, 8000);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              real_name: realName,
              role: "creator",
              terms_accepted_at: new Date().toISOString(),
              terms_version: TERMS_VERSION,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        }),
        7000,
        "SIGNUP_TIMEOUT",
      );

      if (signUpError) {
        window.clearTimeout(watchdog);
        setError(formatAuthError(signUpError.message));
        setPending(false);
        return;
      }

      if (!data.user) {
        window.clearTimeout(watchdog);
        setError("註冊失敗，請稍後再試");
        setPending(false);
        return;
      }

      const alreadyRegistered = (data.user.identities?.length ?? 1) === 0;
      if (alreadyRegistered) {
        window.clearTimeout(watchdog);
        setError("此 Email 已註冊，請直接登入。");
        setPending(false);
        return;
      }

      setPendingLabel("正在建立工作室…");
      const slug = createCreatorSlug(studioName, data.user.id);
      const { error: profileError } = await withTimeout(
        supabase.from("creator_profiles").insert({
          user_id: data.user.id,
          slug,
          studio_name: studioName,
          contact_email: email,
          verification_status: "pending",
        }),
        6000,
        "PROFILE_TIMEOUT",
      );

      if (profileError) {
        const duplicate =
          profileError.code === "23505" ||
          profileError.message.toLowerCase().includes("duplicate");
        if (!duplicate) {
          window.clearTimeout(watchdog);
          setError(formatAuthError(profileError.message));
          setPending(false);
          return;
        }
      }

      const refToApply = referrerRef.trim();
      if (refToApply) {
        await withTimeout(
          supabase.rpc("award_referral_for_signup", {
            p_referred_user_id: data.user.id,
            p_referrer_slug: refToApply,
          }),
          4000,
          "REFERRAL_TIMEOUT",
        ).catch(() => null);
        sessionStorage.removeItem(REF_STORAGE_KEY);
      }

      window.clearTimeout(watchdog);
      window.location.replace("/login?registered=1");
    } catch (err) {
      window.clearTimeout(watchdog);
      const raw = err instanceof Error ? err.message : "註冊失敗，請稍後再試";
      if (raw === "PROFILE_TIMEOUT" || raw === "REFERRAL_TIMEOUT") {
        window.location.replace("/login?registered=1");
        return;
      }
      const message =
        raw === "SIGNUP_TIMEOUT"
          ? "連線登入服務逾時。請改走「登入」；若提示沒有帳號，再回來註冊一次。"
          : formatAuthError(raw);
      setError(message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {referrerRef.trim() ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          已套用推薦碼「{referrerRef.trim()}」；邀請人將依{" "}
          <Link href="/terms#promo-credits" target="_blank" className="text-[var(--accent)] hover:underline">
            推廣折抵點規則
          </Link>{" "}
          獲得折抵點（不可換現，僅供未來訂閱折抵）。
        </p>
      ) : null}
      <input className="input" name="real_name" placeholder="真實姓名（實名驗證用）" required />
      <input className="input" name="studio_name" placeholder="工作室名稱" required />
      <input className="input" name="email" type="email" placeholder="Email" required />
      <input
        className="input"
        name="password"
        type="password"
        placeholder="密碼（至少 6 碼）"
        minLength={6}
        required
      />
      <div>
        <input
          className="input"
          name="referral_code"
          autoComplete="off"
          placeholder="推薦碼（選填，若有人推薦您加入）"
          value={referrerRef}
          onChange={(e) => updateReferrerRef(e.target.value)}
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          也可透過邀請連結自動帶入。註冊完成後，儀表板會顯示<strong>您自己的邀請碼</strong>供日後分享。
        </p>
      </div>
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
        {pending ? pendingLabel : "建立帳號"}
      </button>
    </form>
  );
}
