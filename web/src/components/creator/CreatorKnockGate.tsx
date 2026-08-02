"use client";

import { useEffect, useState } from "react";
import { getUnlockedStudio, knockCreator } from "@/actions/knock";
import { CreatorFullContent } from "@/components/creator/CreatorFullContent";
import {
  mergeCreatorWithUnlock,
  type CreatorKnockUnlock,
  type PublicCreatorProfile,
} from "@/lib/creator/sensitive";
import {
  getVisitorKey,
  isKnockUnlocked,
  setKnockUnlocked,
} from "@/lib/knock/visitor";
import type { CreatorWithPortfolio } from "@/types/database";

interface CreatorKnockGateProps {
  creator: PublicCreatorProfile;
}

export function CreatorKnockGate({ creator }: CreatorKnockGateProps) {
  const [unlock, setUnlock] = useState<CreatorKnockUnlock | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isKnockUnlocked(creator.id)) return;

    let cancelled = false;
    (async () => {
      const result = await getUnlockedStudio(creator.id);
      if (cancelled) return;
      if ("success" in result && result.success) {
        setUnlock(result.unlock);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [creator.id]);

  async function handleKnock() {
    setPending(true);
    setError("");

    const formData = new FormData();
    formData.set("creator_id", creator.id);
    formData.set("visitor_key", getVisitorKey());
    formData.set("page_url", window.location.pathname);
    formData.set("user_agent", navigator.userAgent);

    const result = await knockCreator(formData);
    setPending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setUnlock(result.unlock);
    setKnockUnlocked(creator.id);
  }

  if (!unlock) {
    return (
      <section className="section bg-[var(--surface)]">
        <div className="container-narrow mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-bold">敲門查看工作室</h2>
          <p className="mb-4 text-[var(--text-secondary)]">
            按<strong className="text-[var(--text)]">敲門</strong>後，即可查看{" "}
            {creator.studio_name} 的自介、風格、作品集、價目表與聯絡方式。
          </p>
          <p className="mb-8 text-sm text-[var(--text-muted)]">
            創作者會在後台看到被瀏覽次數，方便了解有多少發案者感興趣。
          </p>
          <button
            type="button"
            onClick={handleKnock}
            disabled={pending}
            className="btn-primary px-10 py-3 text-lg disabled:opacity-70"
          >
            {pending ? "敲門中…" : "敲門"}
          </button>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <p className="mt-6 text-xs text-[var(--text-muted)]">
            敲門表示你有興趣進一步了解。平台不介入後續洽談，次數不限。
          </p>
        </div>
      </section>
    );
  }

  const fullCreator = mergeCreatorWithUnlock(creator, unlock) as CreatorWithPortfolio;
  return <CreatorFullContent creator={fullCreator} />;
}
