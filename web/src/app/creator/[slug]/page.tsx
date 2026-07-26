import Image from "next/image";
import { notFound } from "next/navigation";
import { ClickToPlayVideo } from "@/components/creator/ClickToPlayVideo";
import { ContactSection } from "@/components/creator/ContactSection";
import { CreatorPriceList } from "@/components/creator/CreatorPriceList";
import { CreatorStudioInfo } from "@/components/creator/CreatorStudioInfo";
import { DemoAccountBanner } from "@/components/creator/DemoAccountBanner";
import { DemoBadge } from "@/components/creator/DemoBadge";
import { PortfolioGridWithFilter } from "@/components/creator/PortfolioGridWithFilter";
import { getFeaturedPortfolioItem } from "@/lib/portfolio";
import { isDemoCreator } from "@/lib/demo-creator";
import { getCreatorBySlug } from "@/lib/data/creators";
import { UnpublishedText } from "@/components/creator/UnpublishedText";
import { formatPriceRange } from "@/lib/utils";

interface CreatorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CreatorPageProps) {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator) return { title: "找不到創作者" };
  return {
    title: creator.studio_name,
    description: creator.bio ?? `${creator.studio_name} 的短影音作品集`,
  };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator) notFound();

  const price = isDemoCreator(creator)
    ? null
    : formatPriceRange(creator.price_min, creator.price_max);
  const heroItem = getFeaturedPortfolioItem(creator.portfolio_items);
  const isDemo = isDemoCreator(creator);

  return (
    <>
      {isDemo && <DemoAccountBanner />}
      <section className="relative flex min-h-[50vh] items-end px-6 pb-16 pt-32 md:px-12">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-100 via-slate-200 to-blue-100" aria-hidden />
        {creator.avatar_url && (
          <div className="absolute inset-0 -z-10 opacity-20">
            <Image src={creator.avatar_url} alt="" fill className="object-cover blur-sm" priority />
          </div>
        )}
        <div className="container-narrow flex flex-col gap-6 md:flex-row md:items-end">
          <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-[var(--shadow)]">
            {creator.avatar_url ? (
              <Image src={creator.avatar_url} alt={creator.studio_name} fill className="object-cover" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-4xl font-bold text-slate-500">
                {creator.studio_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-[var(--text)]">
            {creator.region && (
              <p className="mb-2 text-sm text-[var(--text-secondary)]">{creator.region}</p>
            )}
            <h1 className="mb-2 flex flex-wrap items-center gap-3 text-4xl font-bold md:text-5xl">
              {creator.studio_name}
              <DemoBadge creator={creator} className="text-sm" />
            </h1>
            {creator.team_size && (
              <p className="mb-2 text-sm text-[var(--text-secondary)]">{creator.team_size}</p>
            )}
            {price ? (
              <p className="mb-4 text-lg text-[var(--text-secondary)]">{price}</p>
            ) : !isDemo ? (
              <p className="mb-4 text-sm text-[var(--text-muted)]">參考報價：尚未公布</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {creator.style_tags.length > 0 ? (
                creator.style_tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))
              ) : (
                <span className="text-sm text-[var(--text-muted)]">風格標籤：尚未公布</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="mb-4 text-2xl font-bold">關於工作室</h2>
            <p className="mb-6 whitespace-pre-wrap text-[var(--text-secondary)]">
              {creator.bio ?? "尚未公布"}
            </p>
            <p className="text-sm">
              <strong>服務：</strong>{" "}
              {creator.service_types.length > 0
                ? creator.service_types.join("、")
                : "尚未公布"}
            </p>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-bold">精選作品</h2>
            {heroItem ? (
              <ClickToPlayVideo
                embedType={heroItem.embed_type}
                embedUrl={heroItem.embed_url}
                title={heroItem.title}
                thumbnailUrl={heroItem.thumbnail_url}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]">
                <UnpublishedText />
              </div>
            )}
          </div>
        </div>
      </section>

      <CreatorStudioInfo creator={creator} />

      <CreatorPriceList creator={creator} />

      <section className="section">
        <div className="container-narrow">
          <h2 className="mb-10 text-center text-3xl font-bold">全部作品</h2>
          <PortfolioGridWithFilter items={creator.portfolio_items} />
        </div>
      </section>

      <ContactSection creator={creator} />
    </>
  );
}
