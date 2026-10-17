import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const PORTFOLIO_FIELDS =
  "id, title, description, embed_url, embed_type, status, sort_order, created_at";

export default async function AdminLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  await requireAdmin();
  const { email: raw } = await searchParams;
  const email = raw?.trim().toLowerCase() ?? "";

  let account: { id: string; email: string; role: string; created_at: string } | null = null;
  let studios: Record<string, unknown>[] = [];
  let queryError = "";

  if (email) {
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .ilike("email", email)
      .maybeSingle();

    if (profileError) queryError = profileError.message;
    account = profile;

    const select = `studio_name, slug, verification_status, is_listed, is_demo, bio, region, contact_email, website_url, created_at, portfolio_items(${PORTFOLIO_FIELDS})`;
    const byContact = await supabase
      .from("creator_profiles")
      .select(select)
      .ilike("contact_email", email);
    const byUser = account
      ? await supabase.from("creator_profiles").select(select).eq("user_id", account.id)
      : { data: [] as Record<string, unknown>[] | null, error: null };

    if (byContact.error) queryError = queryError || byContact.error.message;
    if (byUser.error) queryError = queryError || byUser.error.message;

    const merged = new Map<string, Record<string, unknown>>();
    for (const row of [...(byContact.data ?? []), ...(byUser.data ?? [])]) {
      merged.set(String(row.slug), row as Record<string, unknown>);
    }
    studios = [...merged.values()];
  }

  return (
    <section className="section">
      <div className="container-narrow max-w-3xl">
        <Link href="/admin/review" className="mb-6 inline-block text-sm text-[var(--accent)]">
          ← 返回審核管理
        </Link>
        <h1 className="mb-4 text-3xl font-bold">查帳號</h1>
        <form className="mb-8 flex flex-wrap gap-2">
          <input
            className="input max-w-md"
            name="email"
            type="email"
            defaultValue={email}
            placeholder="登入或聯絡 Email"
          />
          <button type="submit" className="btn-primary">
            查詢
          </button>
        </form>

        {queryError && <p className="text-sm text-red-600">{queryError}</p>}

        {email && !queryError && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border)] p-4">
              <h2 className="mb-2 font-bold">登入帳號</h2>
              {account ? (
                <ul className="space-y-1 text-sm">
                  <li>Email：{account.email}</li>
                  <li>角色：{account.role}</li>
                  <li>註冊：{new Date(account.created_at).toLocaleString("zh-TW")}</li>
                </ul>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">找不到這個登入信箱</p>
              )}
            </div>

            {studios.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">沒有對應的工作室</p>
            ) : (
              studios.map((studio) => {
                const items = (studio.portfolio_items as Record<string, unknown>[] | null) ?? [];
                return (
                  <div
                    key={String(studio.slug)}
                    className="rounded-xl border border-[var(--border)] p-4"
                  >
                    <h2 className="mb-2 font-bold">{String(studio.studio_name)}</h2>
                    <ul className="mb-4 space-y-1 text-sm">
                      <li>
                        公開頁：{" "}
                        <Link
                          className="text-[var(--accent)]"
                          href={`/creator/${String(studio.slug)}`}
                        >
                          /creator/{String(studio.slug)}
                        </Link>
                      </li>
                      <li>審核：{String(studio.verification_status)}</li>
                      <li>上架：{studio.is_listed ? "是" : "否"}</li>
                      <li>示範帳號：{studio.is_demo ? "是" : "否"}</li>
                      <li>地區：{String(studio.region ?? "未填")}</li>
                      <li>聯絡信箱：{String(studio.contact_email ?? "未填")}</li>
                      <li>官網：{String(studio.website_url ?? "未填")}</li>
                      <li>
                        介紹：
                        {String(studio.bio ?? "").trim()
                          ? `${String(studio.bio).trim().length} 字`
                          : "未填"}
                      </li>
                    </ul>
                    <h3 className="mb-2 text-sm font-bold">作品集（{items.length}）</h3>
                    {items.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)]">還沒有作品連結</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {items.map((item) => (
                          <li key={String(item.id)} className="rounded-lg bg-[var(--bg)] px-3 py-2">
                            <p>
                              {String(item.title)} · {String(item.status)} · {String(item.embed_type)}
                            </p>
                            <p className="break-all text-[var(--text-muted)]">
                              {String(item.embed_url)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}
