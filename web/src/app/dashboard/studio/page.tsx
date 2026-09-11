import Link from "next/link";
import { redirect } from "next/navigation";
import { SchemaSetupBanner } from "@/components/admin/SchemaSetupBanner";
import { PortfolioSection } from "@/components/dashboard/PortfolioSection";
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
            更新工作室資料與作品集。資料與作品分開儲存，各自送出後才會生效。
          </p>
          <p className="mb-10 rounded-xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            工作室資料按 <strong className="text-[var(--text)]">儲存資料</strong>；新作品按{" "}
            <strong className="text-[var(--text)]">新增作品</strong>，送出後需等待審核。
          </p>

          <div className="space-y-16">
            <ProfileForm profile={profile} embedded />
            <PortfolioSection portfolio={portfolio} />
          </div>
        </div>
      </section>
    </>
  );
}
