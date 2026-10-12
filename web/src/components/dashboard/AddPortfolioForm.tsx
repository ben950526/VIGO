"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addPortfolioItem } from "@/actions/creator";
import { TagCheckboxGroup } from "@/components/forms/TagCheckboxGroup";
import { STYLE_TAGS } from "@/lib/constants";

export function AddPortfolioForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSuccess(false);
    setPending(true);
    setError("");

    const result = await addPortfolioItem(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setError("");
    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-6">
      <h3 className="mb-1 text-base font-bold">新增作品</h3>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        貼上 YouTube、Vimeo 或 Instagram Reels 連結（不需上傳影片檔）。
      </p>
      <form action={handleSubmit} className="space-y-4">
        <input className="input" name="title" placeholder="作品標題" required />
        <textarea className="input min-h-24" name="description" placeholder="作品說明（選填）" />
        <input
          className="input"
          name="embed_url"
          placeholder="https://www.youtube.com/watch?v=..."
          required
        />
        <TagCheckboxGroup
          legend="作品風格"
          options={STYLE_TAGS}
          checkboxNamePrefix="tag_"
          customFieldName="style_tags_custom"
          selectedValues={[]}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-700">已送出，等待審核。可繼續新增下一支作品。</p>
        )}
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-70">
          {pending ? "送出中…" : "新增作品"}
        </button>
      </form>
    </div>
  );
}
