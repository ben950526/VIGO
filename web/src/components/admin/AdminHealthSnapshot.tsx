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
        台北時間週一 {stats.weekLabel} 起至今。被瀏覽以各工作室不重複訪客合計；本週敲門不含管理員測試，對方後台仍會計算。
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="本週新註冊" value={stats.registrationsThisWeek} />
        <Stat label="本週被瀏覽" value={stats.uniqueViewsThisWeek} hint="各工作室不重複訪客" />
        <Stat label="本週敲門" value={stats.knocksThisWeek} hint="不含管理員測試" />
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
      <h3 className="mb-1 mt-8 text-base font-bold">邀請碼全站使用</h3>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        看得到「有沒有人用別人的碼註冊」，看不到有沒有轉貼但沒人點。不含示範帳號。
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="真實工作室" value={stats.realStudios} />
        <Stat
          label="用邀請碼註冊"
          value={stats.referredStudios}
          hint={
            stats.realStudios
              ? `約 ${Math.round((stats.referredStudios / stats.realStudios) * 100)}%`
              : undefined
          }
        />
        <Stat label="成功邀請筆數" value={stats.referralSignups} />
        <Stat
          label="有拉到人的邀請人"
          value={stats.referrersWithSuccess}
          hint={`宣傳貼文送審 ${stats.promoSharesSubmitted} · 通過 ${stats.promoSharesApproved}`}
        />
      </div>
    </div>
  );
}
