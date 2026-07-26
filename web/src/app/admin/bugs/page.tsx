import Link from "next/link";
import { BugReportCard } from "@/components/admin/BugReportCard";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { BugReportItem, BugReportStatus } from "@/types/database";

const tabs: { value: BugReportStatus | "all"; label: string }[] = [
  { value: "open", label: "待處理" },
  { value: "investigating", label: "處理中" },
  { value: "fixed", label: "已修復" },
  { value: "wont_fix", label: "無法重現" },
  { value: "all", label: "全部" },
];

export default async function AdminBugsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const { status: statusParam } = await searchParams;
  const statusFilter =
    statusParam && tabs.some((t) => t.value === statusParam) ? statusParam : "open";

  const supabase = await createClient();
  let query = supabase
    .from("bug_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  const items = (data as BugReportItem[]) ?? [];

  return (
    <section className="section">
      <div className="container-narrow max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">BUG 回報</h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              {tabs.find((t) => t.value === statusFilter)?.label}：{items.length} 則
            </p>
          </div>
          <Link href="/admin/review" className="btn-secondary text-sm">
            返回審核管理
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value === "open" ? "/admin/bugs" : `/admin/bugs?status=${tab.value}`}
              className={`rounded-full px-3 py-1.5 text-sm ${
                statusFilter === tab.value
                  ? "bg-[var(--btn)] text-white"
                  : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {error && (
          <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            無法讀取 BUG 回報（請確認已執行 supabase/migrations/010_bug_reports.sql）：
            {error.message}
          </p>
        )}

        {items.length === 0 ? (
          <p className="text-[var(--text-muted)]">此分類尚無回報。</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <BugReportCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
