"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { CreatorFullContent } from "@/components/creator/CreatorFullContent";
import { CreatorKnockGate } from "@/components/creator/CreatorKnockGate";
import { DemoBadge } from "@/components/creator/DemoBadge";
import { OwnerPreviewBanner } from "@/components/dashboard/OwnerPreviewBanner";
import { toPublicCreatorProfile } from "@/lib/creator/sensitive";
import { isDemoCreator } from "@/lib/demo-creator";
import type { CreatorWithPortfolio } from "@/types/database";

type PreviewView = "full" | "knock";

interface OwnerStudioPreviewProps {
  creator: CreatorWithPortfolio;
}

export function OwnerStudioPreview({ creator }: OwnerStudioPreviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view: PreviewView = searchParams.get("view") === "knock" ? "knock" : "full";
  const isDemo = isDemoCreator(creator);
  const publicCreator = toPublicCreatorProfile(creator);

  const setView = useCallback(
    (next: PreviewView) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "knock") params.set("view", "knock");
      else params.delete("view");
      const qs = params.toString();
      router.replace(qs ? `/dashboard/preview?${qs}` : "/dashboard/preview");
    },
    [router, searchParams],
  );

  return (
    <>
      <OwnerPreviewBanner />
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(255,255,255,0.97)] px-6 py-3">
        <div className="container-narrow flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView("full")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                view === "full"
                  ? "bg-[var(--btn)] text-white"
                  : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
              }`}
            >
              敲門後（完整）
            </button>
            <button
              type="button"
              onClick={() => setView("knock")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                view === "knock"
                  ? "bg-[var(--btn)] text-white"
                  : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
              }`}
            >
              敲門前
            </button>
          </div>
          <Link href="/dashboard/studio" className="text-sm text-[var(--accent)] hover:underline">
            ← 返回編輯
          </Link>
        </div>
      </div>

      <section className="relative flex min-h-[50vh] items-end px-6 pb-16 pt-32 md:px-12">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-100 via-slate-200 to-blue-100"
          aria-hidden
        />
        {creator.avatar_url && (
          <div className="absolute inset-0 -z-10 opacity-20">
            <Image src={creator.avatar_url} alt="" fill className="object-cover blur-sm" priority />
          </div>
        )}
        <div className="container-narrow flex flex-col gap-6 md:flex-row md:items-end">
          <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-[var(--shadow)]">
            {creator.avatar_url ? (
              <Image
                src={creator.avatar_url}
                alt={creator.studio_name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-4xl font-bold text-slate-500">
                {creator.studio_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-[var(--text)]">
            {creator.region && (
              <p className="mb-2 text-sm text-[var(--text-secondary)]">{creator.region}</p>
            )}
            <h1 className="mb-2 flex flex-wrap items-center gap-3 text-4xl font-bold md:text-5xl">
              {creator.studio_name}
              <DemoBadge creator={creator} className="text-sm" />
            </h1>
            {view === "knock" && (
              <p className="text-sm text-[var(--text-muted)]">
                敲門後查看自介、風格、作品與聯絡方式
              </p>
            )}
          </div>
        </div>
      </section>

      {view === "full" ? (
        <CreatorFullContent creator={creator} previewMode />
      ) : (
        <CreatorKnockGate
          creator={publicCreator}
          previewSimulation
          onPreviewReveal={() => setView("full")}
        />
      )}

      {isDemo && view === "full" && (
        <p className="pb-8 text-center text-xs text-[var(--text-muted)]">
          示範帳號在真實公開頁不會顯示聯絡方式；您的帳號通過審核後依設定顯示。
        </p>
      )}
    </>
  );
}
