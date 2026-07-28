"use client";

import { useState } from "react";
import { setCreatorListing } from "@/actions/creator";

interface ListingControlProps {
  isListed: boolean;
}

export function ListingControl({ isListed: initialListed }: ListingControlProps) {
  const [isListed, setIsListed] = useState(initialListed);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    const nextListed = formData.get("listed") === "true";

    if (!nextListed) {
      const ok = window.confirm(
        "確定要下架工作室嗎？\n\n帳號與資料都會保留，但將不會出現在探索頁與公開連結。之後可隨時重新上架。",
      );
      if (!ok) return;
    }

    const prev = isListed;
    setIsListed(nextListed);
    setPending(true);
    setError("");

    const result = await setCreatorListing(formData);
    setPending(false);

    if (result.error) {
      setIsListed(prev);
      setError(result.error);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <h3 className="mb-1 text-sm font-semibold">公開上架</h3>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        {isListed
          ? "目前工作室已上架，會出現在探索頁。"
          : "目前已下架。帳號與資料保留，但不會對外顯示。"}
      </p>

      <form action={handleSubmit}>
        <input type="hidden" name="listed" value={isListed ? "false" : "true"} />
        <button
          type="submit"
          disabled={pending}
          className={isListed ? "btn-secondary text-sm disabled:opacity-70" : "btn-primary text-sm disabled:opacity-70"}
        >
          {pending ? "處理中…" : isListed ? "下架工作室" : "重新上架"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
