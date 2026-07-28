import { Suspense } from "react";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { ExploreFilters } from "@/components/explore/ExploreFilters";
import { getApprovedCreators } from "@/lib/data/creators";

export const revalidate = 60;

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string;
    style?: string;
    service?: string;
    region?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const creators = await getApprovedCreators({
    query: params.q,
    styleTag: params.style,
    serviceType: params.service,
    region: params.region,
  });

  return (
    <section className="section">
      <div className="container-narrow">
        <h1 className="mb-3 text-center text-4xl font-bold">探索短影音創作者</h1>
        <p className="mx-auto mb-4 max-w-xl text-center text-[var(--text-secondary)]">
          瀏覽作品集、比較風格，找到適合的接案者後再聯絡。
        </p>
        <p className="mx-auto mb-10 max-w-xl text-center text-xs text-amber-800">
          標示「示範帳號」者為平台範例，並非真實接案創作者，請勿委託或匯款。
        </p>

        <Suspense fallback={<div className="mb-10 h-32 animate-pulse rounded-2xl bg-[var(--border)]" />}>
          <ExploreFilters />
        </Suspense>

        {creators.length === 0 ? (
          <p className="text-center text-[var(--text-muted)]">
            沒有符合條件的創作者，試試其他篩選條件。
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
