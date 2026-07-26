"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { submitBugReport } from "@/actions/bug-report";

interface BugReportFormProps {
  defaultPageUrl?: string | null;
}

export function BugReportForm({ defaultPageUrl }: BugReportFormProps) {
  const searchParams = useSearchParams();
  const pageFromQuery = searchParams.get("page");
  const pageUrl = defaultPageUrl ?? pageFromQuery ?? null;

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [env, setEnv] = useState({ userAgent: "", viewport: "" });

  useEffect(() => {
    setEnv({
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });
  }, []);

  async function handleSubmit(formData: FormData) {
    setSuccess(false);
    formData.set("user_agent", env.userAgent);
    formData.set("viewport", env.viewport);
    if (defaultPageUrl) {
      formData.set("page_url", defaultPageUrl);
    } else if (pageUrl) {
      formData.set("page_url", pageUrl);
    }

    const result = await submitBugReport(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError("");
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-green-900">已收到，我們會盡快處理</p>
        <p className="mt-2 text-sm text-green-800">
          感謝回報！我們會專人排查這個問題，修復後會持續改善平台。
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="bug-message">
          發生什麼事？ <span className="text-red-600">*</span>
        </label>
        <textarea
          id="bug-message"
          className="input min-h-32"
          name="message"
          required
          maxLength={2000}
          placeholder="例如：按儲存沒反應、作品影片播不出來、畫面跑版…"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="bug-steps">
          你剛才做了什麼？（選填）
        </label>
        <textarea
          id="bug-steps"
          className="input min-h-24"
          name="steps"
          maxLength={2000}
          placeholder="例如：改完價目表 → 捲到底 → 按儲存"
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          無需登入或留聯絡方式。我們會自動記錄頁面與裝置資訊，方便排查。送出即表示您同意我們依{" "}
          <a href="/privacy" className="text-[var(--accent)] hover:underline">
            隱私權政策
          </a>{" "}
          處理所填內容。
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary w-full sm:w-auto">
        送出 BUG 回報
      </button>
    </form>
  );
}
