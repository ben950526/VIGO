import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { getApprovedCreators } from "@/lib/data/creators";
import {
  facetHeading,
  facetIntro,
  facetPath,
  isFacetKind,
  listFacetPages,
  matchesFacet,
  MIN_COMBO_STUDIOS,
  parseFacetValue,
  type FacetKind,
} from "@/lib/seo/facets";

export type FacetRouteParams = { kind: string; value: string; service?: string };

/** 解析網址；不在允許清單或沒有工作室就 404 */
export async function resolveFacet(params: FacetRouteParams) {
  if (!isFacetKind(params.kind)) return null;
  const kind: FacetKind = params.kind;
  const value = parseFacetValue(kind, params.value);
  if (!value) return null;
  const service = params.service ? parseFacetValue("service", params.service) : undefined;
  if (params.service && (!service || kind !== "region")) return null;

  const all = await getApprovedCreators();
  const creators = all.filter(
    (c) => matchesFacet(c, kind, value) && (!service || matchesFacet(c, "service", service)),
  );
  if (creators.length === 0) return null;
  if (service && creators.length < MIN_COMBO_STUDIOS) return null;
  return { kind, value, service: service ?? undefined, creators, all };
}

export async function facetMetadata(params: FacetRouteParams) {
  const facet = await resolveFacet(params);
  if (!facet) return { title: "找不到頁面" };
  const title = facetHeading(facet.kind, facet.value, facet.service);
  return {
    title,
    description: facetIntro(facet.kind, facet.value, facet.creators.length, facet.service).slice(0, 150),
    alternates: { canonical: facetPath(facet.kind, facet.value, facet.service) },
  };
}

export async function FacetStudiosPage({ params }: { params: FacetRouteParams }) {
  const facet = await resolveFacet(params);
  if (!facet) notFound();
  const { kind, value, service, creators, all } = facet;

  // 站內互連：同類別的其他頁，讓 Google 和訪客都逛得到
  const related = listFacetPages(all)
    .filter((p) => !(p.kind === kind && p.value === value && p.service === service))
    .filter((p) => (kind === "region" ? p.kind === "region" : p.kind === kind) || p.value === value)
    .slice(0, 12);

  return (
    <section className="section">
      <div className="container-narrow">
        <nav className="mb-4 text-sm text-[var(--text-muted)]">
          <Link href="/explore" className="hover:underline">
            探索全部工作室
          </Link>
          <span className="mx-2">/</span>
          <span>{facetHeading(kind, value, service)}</span>
        </nav>
        <h1 className="mb-3 text-3xl font-bold md:text-4xl">{facetHeading(kind, value, service)}</h1>
        <p className="mb-8 max-w-3xl text-[var(--text-secondary)]">
          {facetIntro(kind, value, creators.length, service)}
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="mb-3 text-xl font-semibold">怎麼在 Vigo 找短影音工作室</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
            <li>點進工作室，先看真實作品、風格和價目。</li>
            <li>對到風格，按「敲門」拿聯絡方式（Email／LINE／電話）。</li>
            <li>直接跟工作室談，Vigo 不抽成、不介入，發案者完全免費。</li>
          </ol>
          <Link href="/explore" className="btn-primary mt-5 inline-block">
            看全部工作室
          </Link>
        </div>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">其他人也在找</h2>
            <ul className="flex flex-wrap gap-2">
              {related.map((p) => (
                <li key={`${p.kind}-${p.value}-${p.service ?? ""}`}>
                  <Link
                    href={facetPath(p.kind, p.value, p.service)}
                    className="inline-block rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {facetHeading(p.kind, p.value, p.service)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
