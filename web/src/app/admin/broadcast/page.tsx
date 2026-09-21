import Link from "next/link";
import { BroadcastMailForm } from "@/components/admin/BroadcastMailForm";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = {
  title: "群發 Email",
};

/** Vercel：大量寄信可能需較長執行時間 */
export const maxDuration = 300;

export default async function AdminBroadcastPage() {
  const profile = await requireAdmin();

  return (
    <section className="section">
      <div className="container-narrow max-w-2xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">群發 Email</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              撰寫公告並寄給已註冊使用者（經 Resend）。請先寄測試信再正式群發。
            </p>
          </div>
          <Link href="/admin/review" className="btn-secondary text-sm">
            返回審核管理
          </Link>
        </div>

        <p className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs leading-relaxed text-[var(--text-muted)]">
          需已設定 Vercel 環境變數：<code>RESEND_API_KEY</code>、<code>SUPABASE_SERVICE_ROLE_KEY</code>
          、<code>EMAIL_FROM</code>。名單過大時若逾時，可改用本機{" "}
          <code>npm run broadcast:relaunch</code> 腳本。
        </p>

        <BroadcastMailForm adminEmail={profile.email} />
      </div>
    </section>
  );
}
