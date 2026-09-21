"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { notifyAdminNewCreatorRegistration } from "@/actions/notify-admin";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth/errors";
import { TERMS_VERSION } from "@/lib/legal";
import { createCreatorSlug, isSupabaseConfigured } from "@/lib/utils";

const REF_STORAGE_KEY = "vigo_referral_ref";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
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
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
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
      });

      if (signUpError) {
        setError(formatAuthError(signUpError.message));
        setPending(false);
        return;
      }

      if (!data.user) {
        setError("註冊失敗，請稍後再試");
        setPending(false);
        return;
      }

      const slug = createCreatorSlug(studioName, data.user.id);
      const { error: profileError } = await supabase.from("creator_profiles").insert({
        user_id: data.user.id,
        slug,
        studio_name: studioName,
        contact_email: email,
        verification_status: "pending",
      });

      if (profileError) {
        setError(formatAuthError(profileError.message));
        setPending(false);
        return;
      }

      await notifyAdminNewCreatorRegistration(studioName, slug);

      const refToApply = referrerRef.trim();
      if (refToApply) {
        await supabase.rpc("award_referral_for_signup", {
          p_referred_user_id: data.user.id,
          p_referrer_slug: refToApply,
        });
        sessionStorage.removeItem(REF_STORAGE_KEY);
      }

      router.push("/dashboard?welcome=1#referral");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "註冊失敗，請稍後再試";
      setError(formatAuthError(message));
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
        {pending ? "建立中…" : "建立帳號"}
      </button>
    </form>
  );
}
