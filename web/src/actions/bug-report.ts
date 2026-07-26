"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

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

  const pageUrl = String(formData.get("page_url") ?? "").trim() || null;
  const userAgent = String(formData.get("user_agent") ?? "").trim() || null;
  const viewport = String(formData.get("viewport") ?? "").trim() || null;

  if (!isSupabaseConfigured()) {
    console.log("[demo bug report]", { message, steps, pageUrl, userAgent, viewport });
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bug_reports").insert({
    message,
    steps,
    page_url: pageUrl,
    user_agent: userAgent,
    viewport,
    status: "open",
  });

  if (error) {
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
