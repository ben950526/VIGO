"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useClientValue } from "@/lib/hooks/useClientValue";
import { knockCreator, syncKnockCookie } from "@/actions/knock";
import type { PublicCreatorProfile } from "@/lib/creator/sensitive";
import {
  KNOCK_VIGO_ATTRIBUTION_BODY,
  KNOCK_VIGO_ATTRIBUTION_CHECKBOX,
  KNOCK_VIGO_ATTRIBUTION_TITLE,
} from "@/lib/knock/copy";
import { getVisitorKey, isKnockUnlocked, setKnockUnlocked } from "@/lib/knock/visitor";

interface CreatorKnockGateProps {
  creator: PublicCreatorProfile;
  /** 接案者預覽：不寫入敲門紀錄，改切換至完整預覽 */
  previewSimulation?: boolean;
  onPreviewReveal?: () => void;
}

export function CreatorKnockGate({
  creator,
  previewSimulation = false,
  onPreviewReveal,
}: CreatorKnockGateProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [agreedAttribution, setAgreedAttribution] = useState(false);
  // 在這個頁面剛敲門成功時不要走「同步中」，避免重複 refresh
  const [knockedHere, setKnockedHere] = useState(false);
  // 這台瀏覽器之前就敲過門：先顯示同步中，等 cookie 補上後重新整理
  const unlockedBefore = useClientValue(
    () => !previewSimulation && isKnockUnlocked(creator.id),
    false,
  );
  const syncing = unlockedBefore && !knockedHere;

  useEffect(() => {
    if (!syncing) return;

    let cancelled = false;
    (async () => {
      await syncKnockCookie(creator.id);
      if (!cancelled) router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [creator.id, router, syncing]);

  if (previewSimulation) {
    return (
      <section className="section bg-[var(--surface)]">
        <div className="container-narrow mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-bold">敲門查看聯絡方式</h2>
          <p className="mb-4 text-[var(--text-secondary)]">
            上面的作品可以先看。對到風格後，按<strong className="text-[var(--text)]">敲門</strong>
            才會看到 {creator.studio_name} 的聯絡方式。
          </p>
          <p className="mb-6 text-sm text-[var(--text-muted)]">
            這是預覽模擬，不會計入敲門次數。
          </p>
          <KnockAttributionNotice />
          <KnockAttributionCheckbox
            id="knock-attribution-preview"
            checked={agreedAttribution}
            onChange={setAgreedAttribution}
          />
          <button
            type="button"
            onClick={() => onPreviewReveal?.()}
            disabled={!agreedAttribution}
            className="btn-primary px-10 py-3 text-lg disabled:opacity-70"
          >
            模擬敲門成功 → 看聯絡方式
          </button>
        </div>
      </section>
    );
  }

  if (syncing) {
    return (
      <section className="section bg-[var(--surface)]">
        <div className="container-narrow mx-auto max-w-2xl py-12 text-center text-[var(--text-muted)]">
          載入工作室內容…
        </div>
      </section>
    );
  }

  async function handleKnock() {
    if (!agreedAttribution) {
      setError("敲門前請先答應：第一則私訊會說是在 Vigo 看到的");
      return;
    }

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

    setKnockedHere(true);
    setKnockUnlocked(creator.id);
    router.refresh();
  }

  return (
    <section className="section bg-[var(--surface)]">
      <div className="container-narrow mx-auto max-w-2xl text-center">
        <h2 className="mb-3 text-3xl font-bold">敲門查看聯絡方式</h2>
        <p className="mb-4 text-[var(--text-secondary)]">
          作品可以免費先看。真的想進一步合作，再按<strong className="text-[var(--text)]">敲門</strong>
          查看 {creator.studio_name} 的聯絡方式。
        </p>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          創作者後台會分開看「有多少人來逛作品」和「有多少人敲門要聯絡」。
        </p>
        <KnockAttributionNotice />
        <KnockAttributionCheckbox
          id="knock-attribution"
          checked={agreedAttribution}
          onChange={setAgreedAttribution}
        />
        <button
          type="button"
          onClick={handleKnock}
          disabled={pending || !agreedAttribution}
          className="btn-primary px-10 py-3 text-lg disabled:opacity-70"
        >
          {pending ? "敲門中…" : "敲門，查看聯絡方式"}
        </button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <p className="mt-6 text-xs text-[var(--text-muted)]">
          敲門表示你願意留下聯絡、進一步洽談。平台不介入後續，次數不限。
        </p>
      </div>
    </section>
  );
}

function KnockAttributionNotice() {
  return (
    <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-4 text-left text-sm text-[var(--text-secondary)]">
      <p className="font-semibold text-[var(--text)]">{KNOCK_VIGO_ATTRIBUTION_TITLE}</p>
      <p className="mt-2">{KNOCK_VIGO_ATTRIBUTION_BODY}</p>
    </div>
  );
}

function KnockAttributionCheckbox({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="mb-8 flex cursor-pointer items-start gap-3 text-left text-sm text-[var(--text)]">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0"
      />
      <span>{KNOCK_VIGO_ATTRIBUTION_CHECKBOX}</span>
    </label>
  );
}
