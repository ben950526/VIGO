import Link from "next/link";
import { redirect } from "next/navigation";
import { SchemaSetupBanner } from "@/components/admin/SchemaSetupBanner";
import { PortfolioSection } from "@/components/dashboard/PortfolioSection";
import { StudioPreviewBar } from "@/components/dashboard/StudioPreviewBar";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { getDashboardData } from "@/lib/data/dashboard";
import { checkCreatorProfileSchema } from "@/lib/db-schema";
import { isSupabaseConfigured } from "@/lib/utils";

export default async function StudioContentPage() {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const data = await getDashboardData();
  if (!data) redirect("/login");

  const { profile, portfolio } = data;
  const schema = await checkCreatorProfileSchema();

  return (
    <>
      {!schema.ok && <SchemaSetupBanner />}
      <section className="section">
        <div className="container-narrow max-w-2xl">
          <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--accent)]">
            ← 返回我的工作室
          </Link>
          <h1 className="mb-2 text-3xl font-bold">編輯工作室內容</h1>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            介紹、地區、服務、風格與聯絡方式建議一次填清楚。作品另外貼連結即可，送出後會審這支影片。
          </p>
          <p className="mb-6 rounded-xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            工作室資料按 <strong className="text-[var(--text)]">儲存資料</strong>；新作品按{" "}
            <strong className="text-[var(--text)]">新增作品</strong>。
          </p>

          <StudioPreviewBar slug={profile.slug} />

          <div className="space-y-16">
            <ProfileForm profile={profile} embedded />
            <PortfolioSection portfolio={portfolio} />
          </div>
        </div>
      </section>
    </>
  );
}
