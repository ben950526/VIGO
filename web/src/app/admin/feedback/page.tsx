import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { FeedbackItem } from "@/types/database";

const roleLabel: Record<string, string> = {
  client: "發案者",
  creator: "接案者",
  visitor: "逛逛",
};

export default async function AdminFeedbackPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const items = (data as FeedbackItem[]) ?? [];

  return (
    <section className="section">
      <div className="container-narrow max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">使用者意見</h1>
            <p className="mt-2 text-[var(--text-secondary)]">共 {items.length} 則（最近 100 則）</p>
          </div>
          <Link href="/admin/review" className="btn-secondary text-sm">
            返回審核管理
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            無法讀取意見（請確認已執行 supabase/migrations/009_feedback.sql）：{error.message}
          </p>
        )}

        {items.length === 0 ? (
          <p className="text-[var(--text-muted)]">尚無意見。</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="mb-3 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                  <span>{new Date(item.created_at).toLocaleString("zh-TW")}</span>
                  {item.role && <span>{roleLabel[item.role] ?? item.role}</span>}
                  {item.contact_email && <span>{item.contact_email}</span>}
                </div>
                <p className="whitespace-pre-wrap text-[var(--text)]">{item.message}</p>
                {item.page_url && (
                  <p className="mt-2 truncate text-xs text-[var(--text-muted)]">來自：{item.page_url}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
