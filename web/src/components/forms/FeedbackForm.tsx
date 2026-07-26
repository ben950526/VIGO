"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { submitFeedback } from "@/actions/feedback";

interface FeedbackFormProps {
  defaultPageUrl?: string | null;
}

export function FeedbackForm({ defaultPageUrl }: FeedbackFormProps) {
  const searchParams = useSearchParams();
  const pageFromQuery = searchParams.get("page");
  const pageUrl = defaultPageUrl ?? pageFromQuery ?? null;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSuccess(false);
    if (defaultPageUrl) {
      formData.set("page_url", defaultPageUrl);
    } else if (pageUrl) {
      formData.set("page_url", pageUrl);
    }
    const result = await submitFeedback(formData);
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
        <p className="text-lg font-semibold text-green-900">收到了，非常感謝！</p>
        <p className="mt-2 text-sm text-green-800">
          我們會認真閱讀，並高度採納到 Vigo 的改版中。
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="feedback-message">
          你的建議 <span className="text-red-600">*</span>
        </label>
        <textarea
          id="feedback-message"
          className="input min-h-36"
          name="message"
          required
          maxLength={2000}
          placeholder="例如：希望探索頁能篩選價格區間、創作者頁想看到更多作品案例…"
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          自由填寫即可，幾句話就很有幫助，約 30 秒能寫完。無需登入或留聯絡方式。
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary w-full sm:w-auto">
        送出建議
      </button>
    </form>
  );
}
