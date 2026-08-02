import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/actions/auth";
import { setFeaturedPortfolioItem } from "@/actions/creator";
import { getDashboardData } from "@/lib/data/dashboard";
import { getCreatorKnockStats } from "@/lib/data/knocks";
import { isFeaturedPortfolioItem } from "@/lib/portfolio";
import { isSupabaseConfigured } from "@/lib/utils";
import { ListingControl } from "@/components/dashboard/ListingControl";
import { SubmitButton } from "@/components/forms/SubmitButton";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="section">
        <div className="container-narrow max-w-2xl text-center">
          <h1 className="mb-4 text-3xl font-bold">我的工作室</h1>
          <p className="mb-6 text-[var(--text-secondary)]">
            請複製 <code>.env.example</code> 為 <code>.env.local</code>，填入 Supabase
            憑證並執行 migration 後即可註冊登入。
          </p>
        </div>
      </section>
    );
  }

  const data = await getDashboardData();
  if (!data) redirect("/login");

  const { profile, portfolio, isAdmin } = data;
  const knockStats = await getCreatorKnockStats(profile.id);

  return (
    <section className="section">
      <div className="container-narrow max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">我的工作室</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Link href="/admin/review" className="btn-primary text-sm">
                審核管理
              </Link>
            )}
            <form action={signOut}>
              <SubmitButton className="btn-secondary text-sm">登出</SubmitButton>
            </form>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="mb-2">
            <strong>狀態：</strong>{" "}
            {profile.verification_status === "approved"
              ? profile.is_listed
                ? "已公開上架"
                : "已下架（帳號保留，不對外顯示）"
              : profile.verification_status === "pending"
                ? "審核中"
                : "未通過"}
          </p>
          <p className="mb-4 text-[var(--text-secondary)]">
            <Link href={`/creator/${profile.slug}`} className="text-[var(--accent)] hover:underline">
              {profile.studio_name}
            </Link>
            {" "}· /creator/{profile.slug}
          </p>
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm">
            <p className="font-medium text-[var(--text)]">敲門統計</p>
            <p className="mt-1 text-[var(--text-secondary)]">
              累計 {knockStats.total} 次 · 本週 {knockStats.thisWeek} 次 · 本月 {knockStats.thisMonth} 次
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              發案者敲門後才會看到完整工作室內容；每次敲門都會計入次數。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/profile" className="btn-primary">
              編輯資料
            </Link>
            <Link href="/dashboard/portfolio/new" className="btn-secondary">
              新增作品
            </Link>
            <Link href={`/creator/${profile.slug}`} className="btn-secondary">
              {profile.verification_status === "approved" && profile.is_listed
                ? "查看公開頁"
                : "預覽工作室"}
            </Link>
          </div>

          {profile.verification_status === "approved" && (
            <ListingControl isListed={profile.is_listed} />
          )}
        </div>

        <h2 className="mb-2 text-xl font-bold">我的作品 ({portfolio.length})</h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          公開頁的「精選作品」= 排序第一且已審核通過的作品。按「設為精選」可更換。
        </p>
        {portfolio.length === 0 ? (
          <p className="text-[var(--text-muted)]">尚無作品，請新增 YouTube / Reels 連結。</p>
        ) : (
          <ul className="space-y-3">
            {portfolio.map((item) => {
              const isFeatured = isFeaturedPortfolioItem(item, portfolio);
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      {isFeatured && item.status === "approved" && (
                        <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                          精選作品
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      狀態：{item.status === "approved" ? "已公開" : item.status === "pending" ? "審核中" : "未通過"}
                    </p>
                  </div>
                  {!isFeatured && item.status === "approved" && (
                    <form action={setFeaturedPortfolioItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <SubmitButton className="btn-secondary text-sm">設為精選</SubmitButton>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
