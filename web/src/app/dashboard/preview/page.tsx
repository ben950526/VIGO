import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OwnerStudioPreview } from "@/components/dashboard/OwnerStudioPreview";
import { getOwnerStudioPreview } from "@/lib/data/dashboard";
import { isSupabaseConfigured } from "@/lib/utils";

export default async function OwnerPreviewPage() {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const creator = await getOwnerStudioPreview();
  if (!creator) redirect("/login");

  return (
    <Suspense fallback={<div className="section text-center text-[var(--text-muted)]">載入預覽…</div>}>
      <OwnerStudioPreview creator={creator} />
    </Suspense>
  );
}
