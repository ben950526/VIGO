import type { AdminHealthStats } from "@/lib/data/adminHealth";

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

export function AdminHealthSnapshot({ stats }: { stats: AdminHealthStats }) {
  return (
    <div className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="mb-1 text-xl font-bold">本週狀況</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        台北時間週一 {stats.weekLabel} 起至今。被瀏覽以各工作室不重複訪客合計；敲門是按了解鎖的次數。
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="本週新註冊" value={stats.registrationsThisWeek} />
        <Stat label="本週被瀏覽" value={stats.uniqueViewsThisWeek} hint="各工作室不重複訪客" />
        <Stat label="本週敲門" value={stats.knocksThisWeek} />
        <Stat label="已上架工作室" value={stats.approvedListed} hint="通過審核且未下架" />
        <Stat label="待審工作室" value={stats.pendingCreators} />
        <Stat label="待審作品" value={stats.pendingWorks} />
        <Stat label="待審宣傳" value={stats.pendingPromo} />
        <Stat
          label="本週意見／BUG"
          value={stats.feedbackThisWeek + stats.bugsThisWeek}
          hint={`意見 ${stats.feedbackThisWeek} · BUG ${stats.bugsThisWeek}`}
        />
      </div>
    </div>
  );
}
