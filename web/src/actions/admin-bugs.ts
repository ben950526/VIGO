"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { BugReportStatus } from "@/types/database";

const validStatuses: BugReportStatus[] = ["open", "investigating", "fixed", "wont_fix"];

export async function updateBugReport(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as BugReportStatus;
  const adminNote = String(formData.get("admin_note") ?? "").trim() || null;

  if (!id) return { error: "缺少回報 ID" };
  if (!validStatuses.includes(status)) return { error: "狀態無效" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bug_reports")
    .update({
      status,
      admin_note: adminNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/bugs");
  return { success: true };
}
