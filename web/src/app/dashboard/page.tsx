import { redirect } from "next/navigation";
import Link from "next/link";
import { setFeaturedPortfolioItem } from "@/actions/creator";
import { SignOutButton } from "@/components/forms/SignOutButton";
import { DashboardOnboarding } from "@/components/dashboard/DashboardOnboarding";
import { DashboardReferralWelcome } from "@/components/dashboard/DashboardReferralWelcome";
import { PromoSharePanel } from "@/components/dashboard/PromoSharePanel";
import { ReferralCreditsPanel } from "@/components/dashboard/ReferralCreditsPanel";
import {
  isCreatorVisibleOnExplore,
  studioExploreContentGaps,
} from "@/lib/creator/listing";
import { studioSubmitGaps } from "@/lib/creator/studioSubmit";
import { getDashboardData } from "@/lib/data/dashboard";
import { getCreatorKnockStats } from "@/lib/data/knocks";
import { getCreatorViewStats } from "@/lib/data/page-views";
import { getMyPromoShareSubmissions } from "@/lib/data/promo-share";
import { getReferralDashboardStats } from "@/lib/data/referral";
import { siteUrl } from "@/lib/email/config";
import { buildReferralRegisterUrl, resolvePublicInviteCode } from "@/lib/referral/config";
import { isFeaturedPortfolioItem } from "@/lib/portfolio";
import { isSupabaseConfigured } from "@/lib/utils";
import { ListingControl } from "@/components/dashboard/ListingControl";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Suspense } from "react";

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
  const listingInput = { ...profile, portfolio_items: portfolio };
  const visibleOnExplore = isCreatorVisibleOnExplore(listingInput);
  const exploreGaps = studioExploreContentGaps(listingInput);
  const submitGaps = studioSubmitGaps(profile);
  const hasWork = portfolio.some((item) => item.status !== "rejected");
  const [knockStats, viewStats, referralStats, promoShareSubmissions] = await Promise.all([
    getCreatorKnockStats(profile.id),
    getCreatorViewStats(profile.id),
    getReferralDashboardStats(),
    getMyPromoShareSubmissions(),
  ]);
  const inviteCode = resolvePublicInviteCode(profile);
  const referralUrl = buildReferralRegisterUrl(siteUrl(), inviteCode);

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
            <SignOutButton className="btn-secondary text-sm">登出</SignOutButton>
          </div>
        </div>

        <Suspense fallback={null}>
          <DashboardReferralWelcome />
        </Suspense>

        <DashboardOnboarding
          missingStudio={submitGaps}
          hasWork={hasWork}
          reviewStatus={profile.verification_status}
        />

        <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="mb-2">
            <strong>狀態：</strong>{" "}
            {profile.verification_status === "approved"
              ? !profile.is_listed
                ? "已下架（帳號保留，不對外顯示）"
                : visibleOnExplore
                  ? "已公開上架"
                  : "已通過審核，補作品後才會出現在探索頁"
              : profile.verification_status === "rejected"
                ? "未通過"
                : "審核中"}
          </p>
          <p className="mb-4 text-[var(--text-secondary)]">
            <Link href={`/creator/${profile.slug}`} className="text-[var(--accent)] hover:underline">
              {profile.studio_name}
            </Link>
            {" "}· /creator/{profile.slug}
          </p>
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm">
            <p className="font-medium text-[var(--text)]">被瀏覽</p>
            <p className="mt-1 text-[var(--text-secondary)]">
              累計 {viewStats.uniqueTotal} 人看過 · 本週 {viewStats.uniqueThisWeek} 人 · 本月{" "}
              {viewStats.uniqueThisMonth} 人
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              公開頁被打開即計算（同一人同一天只算一次）。自己預覽不算。
            </p>
            <p className="mt-3 font-medium text-[var(--text)]">敲門</p>
            <p className="mt-1 text-[var(--text-secondary)]">
              累計 {knockStats.total} 次 · 本週 {knockStats.thisWeek} 次 · 本月 {knockStats.thisMonth} 次
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              發案者按敲門後才看得到完整內容與聯絡方式。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/studio" className="btn-primary">
              編輯工作室內容
            </Link>
            <Link href="/dashboard/preview" className="btn-secondary">
              預覽公開頁
            </Link>
          </div>

          {profile.verification_status === "approved" && profile.is_listed && exploreGaps.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">探索頁暫時不會顯示你的工作室</p>
              <p className="mt-1">
                請補：{exploreGaps.join("、")}。通過後不必再審核一次，資料齊了就會出現。
              </p>
            </div>
          ) : null}

          {profile.verification_status === "approved" && (
            <ListingControl
              isListed={profile.is_listed}
              visibleOnExplore={visibleOnExplore}
            />
          )}
        </div>

        <ReferralCreditsPanel
          inviteCode={inviteCode}
          referralUrl={referralUrl}
          balance={profile.promo_credits_balance}
          successfulInvites={referralStats?.successfulInvites ?? 0}
        />

        <PromoSharePanel
          inviteCode={inviteCode}
          referralUrl={referralUrl}
          submissions={promoShareSubmissions}
        />

        <h2 className="mb-2 text-xl font-bold">我的作品 ({portfolio.length})</h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          建議至少加 1 支。通過審核後，有已公開作品才會出現在探索頁。按「設為精選」可更換精選。
        </p>
        {portfolio.length === 0 ? (
          <p className="text-[var(--text-muted)]">
            尚無作品，請至{" "}
            <Link href="/dashboard/studio#portfolio" className="text-[var(--accent)] hover:underline">
              編輯工作室內容
            </Link>{" "}
            新增 YouTube / Reels 連結。
          </p>
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
