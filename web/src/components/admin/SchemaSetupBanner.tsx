export function SchemaSetupBanner() {
  return (
    <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <p className="font-semibold">資料庫需要一次性更新</p>
      <p className="mt-2">
        儲存工作室資料前，請到 <strong>Supabase → SQL Editor</strong>，貼上並執行專案裡的{" "}
        <code className="rounded bg-amber-100 px-1">supabase/RUN_ONCE.sql</code>。
        執行完重新整理此頁即可正常儲存。
      </p>
    </div>
  );
}
