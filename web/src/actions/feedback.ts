"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export async function submitFeedback(formData: FormData) {
  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 2) {
    return { error: "請至少寫幾個字，我們才方便理解你的建議" };
  }
  if (message.length > 2000) {
    return { error: "內容請控制在 2000 字以內" };
  }

  const pageUrl = String(formData.get("page_url") ?? "").trim() || null;

  if (!isSupabaseConfigured()) {
    console.log("[demo feedback]", { message, pageUrl });
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({
    message,
    role: null,
    contact_email: null,
    page_url: pageUrl,
  });

  if (error) {
    if (error.message.includes("feedback") || error.message.includes("schema cache")) {
      return {
        error:
          "意見箱尚未啟用。請到 Supabase SQL Editor 執行 supabase/migrations/009_feedback.sql 後再試。",
      };
    }
    return { error: error.message };
  }

  return { success: true };
}
