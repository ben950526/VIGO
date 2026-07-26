"use client";

import { useState } from "react";
import Link from "next/link";
import { addPortfolioItem } from "@/actions/creator";
import { TagCheckboxGroup } from "@/components/forms/TagCheckboxGroup";
import { STYLE_TAGS } from "@/lib/constants";

export default function NewPortfolioPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSuccess(false);
    const result = await addPortfolioItem(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError("");
    setSuccess(true);
  }

  return (
    <section className="section">
      <div className="container-narrow max-w-2xl">
        <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--accent)]">
          ← 返回我的工作室
        </Link>
        <h1 className="mb-2 text-3xl font-bold">新增作品</h1>
        <p className="mb-8 text-[var(--text-secondary)]">
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
          {success && <p className="text-sm text-green-700">已送出，等待審核。</p>}
          <button type="submit" className="btn-primary">新增作品</button>
        </form>
      </div>
    </section>
  );
}
