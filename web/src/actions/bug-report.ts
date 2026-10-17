"use server";

import { getAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function submitBugReport(formData: FormData) {
  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 2) {
    return { error: "請描述遇到的問題，我們才好排查" };
  }
  if (message.length > 2000) {
    return { error: "內容請控制在 2000 字以內" };
  }

  const steps = String(formData.get("steps") ?? "").trim() || null;
  if (steps && steps.length > 2000) {
    return { error: "操作步驟請控制在 2000 字以內" };
  }

  const contactEmailRaw = String(formData.get("contact_email") ?? "").trim();
  const contactEmail = contactEmailRaw ? contactEmailRaw.toLowerCase() : null;
  if (contactEmail && !isLikelyEmail(contactEmail)) {
    return { error: "Email 格式看起來不對，請再檢查一次" };
  }

  const pageUrl = String(formData.get("page_url") ?? "").trim() || null;
  const userAgent = String(formData.get("user_agent") ?? "").trim() || null;
  const viewport = String(formData.get("viewport") ?? "").trim() || null;

  if (!isSupabaseConfigured()) {
    console.log("[demo bug report]", { message, steps, pageUrl, userAgent, viewport, contactEmail });
    return { success: true };
  }

  const session = await getAuthSession();
  const reporterId = session?.user?.id ?? null;
  const email = contactEmail || session?.user?.email?.trim().toLowerCase() || null;

  const supabase = await createClient();
  const payload = {
    message,
    steps,
    page_url: pageUrl,
    user_agent: userAgent,
    viewport,
    status: "open" as const,
    reporter_id: reporterId,
    contact_email: email,
  };

  const { error } = await supabase.from("bug_reports").insert(payload);

  if (error) {
    const missingNotifyColumns =
      error.message.includes("contact_email") ||
      error.message.includes("reporter_id") ||
      error.message.includes("schema cache");

    if (missingNotifyColumns) {
      const retry = await supabase.from("bug_reports").insert({
        message,
        steps,
        page_url: pageUrl,
        user_agent: userAgent,
        viewport,
        status: "open",
      });
      if (!retry.error) return { success: true };
    }

    if (error.message.includes("bug_reports") || error.message.includes("schema cache")) {
      return {
        error:
          "BUG 回報尚未啟用。請到 Supabase SQL Editor 執行 supabase/migrations/010_bug_reports.sql 後再試。",
      };
    }
    return { error: error.message };
  }

  return { success: true };
}

export async function confirmOwnBugFixed(reportId: string) {
  if (!isSupabaseConfigured()) {
    return { error: "請先設定資料庫" };
  }
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { error: "請先登入" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_own_bug_fixed", {
    p_id: reportId,
  });

  if (error) {
    if (error.message.includes("confirm_own_bug_fixed") || error.message.includes("schema cache")) {
      return { error: "確認功能尚未啟用。請先執行 migrations/029_bug_user_confirm.sql" };
    }
    return { error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    return { error: payload?.error || "確認失敗，請再試一次" };
  }

  return { success: true };
}

export async function reopenOwnBug(reportId: string) {
  if (!isSupabaseConfigured()) {
    return { error: "請先設定資料庫" };
  }
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { error: "請先登入" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reopen_own_bug", {
    p_id: reportId,
  });

  if (error) {
    if (error.message.includes("reopen_own_bug") || error.message.includes("schema cache")) {
      return { error: "回報功能尚未啟用。請先執行 migrations/030_bug_user_reopen.sql" };
    }
    return { error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    return { error: payload?.error || "送出失敗，請再試一次" };
  }

  return { success: true };
}
