"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { sendBugFixedEmail } from "@/lib/email/sendBugFixedEmail";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { BugReportStatus } from "@/types/database";

const validStatuses: BugReportStatus[] = ["open", "investigating", "fixed", "wont_fix"];

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

async function resolveReporterEmail(params: {
  formEmail: string | null;
  storedEmail: string | null;
  reporterId: string | null;
}): Promise<string | null> {
  if (params.formEmail) return params.formEmail;
  if (params.storedEmail) return params.storedEmail;
  if (!params.reporterId) return null;

  const service = createServiceClient();
  if (service) {
    const { data, error } = await service.auth.admin.getUserById(params.reporterId);
    if (!error) {
      const fromAuth = data.user?.email?.trim().toLowerCase() || null;
      if (fromAuth) return fromAuth;
    }
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", params.reporterId)
    .maybeSingle();
  return data?.email?.trim().toLowerCase() || null;
}

export async function updateBugReport(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as BugReportStatus;
  const adminNote = String(formData.get("admin_note") ?? "").trim() || null;
  const userReply = String(formData.get("user_reply") ?? "").trim() || null;
  const formEmailRaw = String(formData.get("contact_email") ?? "").trim().toLowerCase();
  const formEmail = formEmailRaw || null;
  const notifyRequested = String(formData.get("notify_reporter") ?? "") === "1";

  if (!id) return { error: "缺少回報 ID" };
  if (!validStatuses.includes(status)) return { error: "狀態無效" };
  if (formEmail && !isLikelyEmail(formEmail)) {
    return { error: "通知用 Email 格式不對" };
  }
  if (userReply && userReply.length > 4000) {
    return { error: "給對方的重試步驟請控制在 4000 字以內" };
  }
  const shouldNotify = notifyRequested && status === "fixed";
  if (shouldNotify && !userReply) {
    return { error: "要寄信的話，請先寫給對方的重試步驟" };
  }

  const supabase = await createClient();
  let existing: {
    id: string;
    message: string;
    page_url: string | null;
    contact_email: string | null;
    reporter_id: string | null;
    notified_at: string | null;
  } | null = null;

  const loaded = await supabase
    .from("bug_reports")
    .select("id, message, page_url, contact_email, reporter_id, notified_at")
    .eq("id", id)
    .maybeSingle();

  if (loaded.error) {
    const fallback = await supabase
      .from("bug_reports")
      .select("id, message, page_url")
      .eq("id", id)
      .maybeSingle();
    if (fallback.error) return { error: fallback.error.message };
    if (!fallback.data) return { error: "找不到這則回報" };
    existing = {
      ...fallback.data,
      contact_email: null,
      reporter_id: null,
      notified_at: null,
    };
  } else {
    existing = loaded.data;
  }

  if (!existing) return { error: "找不到這則回報" };

  const patch = {
    status,
    admin_note: adminNote,
    user_reply: userReply,
    contact_email: formEmail ?? existing.contact_email,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("bug_reports").update(patch).eq("id", id);

  if (error) {
    const missingColumns =
      error.message.includes("user_reply") ||
      error.message.includes("contact_email") ||
      error.message.includes("notified_at") ||
      error.message.includes("schema cache");
    if (missingColumns) {
      const fallback = await supabase
        .from("bug_reports")
        .update({
          status,
          admin_note: adminNote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (fallback.error) return { error: fallback.error.message };
      revalidatePath("/admin/bugs");
      return {
        success: true,
        notified: false,
        notifyError: "資料庫尚未加上通知欄位，請先執行 migrations/027_bug_report_notify.sql",
      };
    }
    return { error: error.message };
  }

  if (!shouldNotify) {
    revalidatePath("/admin/bugs");
    return { success: true, notified: false };
  }

  const to = await resolveReporterEmail({
    formEmail,
    storedEmail: existing.contact_email?.trim().toLowerCase() || null,
    reporterId: existing.reporter_id,
  });

  if (!to) {
    revalidatePath("/admin/bugs");
    return {
      success: true,
      notified: false,
      notifyError: "已更新狀態，但這則回報沒有信箱，無法寄出。請填對方 Email 再寄一次。",
    };
  }

  const sent = await sendBugFixedEmail({
    to,
    reportMessage: existing.message,
    retrySteps: userReply as string,
    pageUrl: existing.page_url,
  });

  if (!sent.ok) {
    revalidatePath("/admin/bugs");
    return {
      success: true,
      notified: false,
      notifyError: `已更新狀態，但信件沒寄出：${sent.error}`,
    };
  }

  await supabase
    .from("bug_reports")
    .update({
      notified_at: new Date().toISOString(),
      contact_email: to,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/bugs");
  return { success: true, notified: true };
}
