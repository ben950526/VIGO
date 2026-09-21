"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function DashboardReferralWelcome() {
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";

  useEffect(() => {
    if (!isWelcome) return;
    const el = document.getElementById("referral");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `${window.location.pathname}#referral`);
  }, [isWelcome]);

  if (!isWelcome) return null;

  return (
    <div className="mb-6 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--text-secondary)]">
      註冊完成！請在下方保存<strong className="text-[var(--text)]">您專屬的邀請碼</strong>
      與邀請連結，日後分享給其他接案者即可累積折抵點（此頁面隨時可回來查看）。
    </div>
  );
}
