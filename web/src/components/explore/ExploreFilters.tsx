"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { REGIONS, SERVICE_TYPES, STYLE_TAGS } from "@/lib/constants";

export function ExploreFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState("");
  const [style, setStyle] = useState("");
  const [service, setService] = useState("");

  const [region, setRegion] = useState("");

  useEffect(() => {
    setQuery(params.get("q") ?? "");
    setStyle(params.get("style") ?? "");
    setService(params.get("service") ?? "");
    setRegion(params.get("region") ?? "");
  }, [params]);

  function handleSearch() {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (style) next.set("style", style);
    if (service) next.set("service", service);
    if (region) next.set("region", region);
    const qs = next.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
  }

  function handleReset() {
    setQuery("");
    setStyle("");
    setService("");
    setRegion("");
    router.push("/explore");
  }

  const fieldClass =
    "h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]";

  return (
    <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${fieldClass} min-w-[140px] flex-1`}
          placeholder="工作室名稱、風格..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />

        <select
          className={`${fieldClass} w-auto min-w-[120px]`}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="地區"
        >
          <option value="">全部地區</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          className={`${fieldClass} w-auto min-w-[110px]`}
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          aria-label="風格"
        >
          <option value="">全部風格</option>
          {STYLE_TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          className={`${fieldClass} w-auto min-w-[110px]`}
          value={service}
          onChange={(e) => setService(e.target.value)}
          aria-label="服務"
        >
          <option value="">全部服務</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSearch}
          className="h-10 shrink-0 rounded-full bg-[var(--btn)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--btn-hover)]"
        >
          搜尋
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="h-10 shrink-0 rounded-full border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]"
        >
          清除
        </button>
      </div>
    </div>
  );
}
