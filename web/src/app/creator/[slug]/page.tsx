import Image from "next/image";
import { notFound } from "next/navigation";
import { CreatorFullContent } from "@/components/creator/CreatorFullContent";
import { CreatorKnockGate } from "@/components/creator/CreatorKnockGate";
import { DemoAccountBanner } from "@/components/creator/DemoAccountBanner";
import { DemoBadge } from "@/components/creator/DemoBadge";
import { StudioPreviewBanner } from "@/components/creator/StudioPreviewBanner";
import { isDemoCreator } from "@/lib/demo-creator";
import { toPublicCreatorProfile } from "@/lib/creator/sensitive";
import { getCreatorPageBySlug } from "@/lib/data/creators";
import { isCreatorKnockUnlocked } from "@/lib/knock/cookie";

interface CreatorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CreatorPageProps) {
  const { slug } = await params;
  const page = await getCreatorPageBySlug(slug);
  if (!page) return { title: "找不到創作者" };
  return {
    title: page.creator.studio_name,
    description: `${page.creator.studio_name} 的短影音作品集`,
  };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { slug } = await params;
  const page = await getCreatorPageBySlug(slug);
  if (!page) notFound();

  const { creator, previewReason } = page;
  const isPreview = Boolean(previewReason);
  const isDemo = isDemoCreator(creator);
  const publicCreator = toPublicCreatorProfile(creator);
  const knocked =
    !isPreview && !isDemo && (await isCreatorKnockUnlocked(creator.id));
  const showFullContent = isPreview || isDemo || knocked;

  return (
    <>
      {previewReason && <StudioPreviewBanner reason={previewReason} />}
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
            {!showFullContent && (
              <p className="text-sm text-[var(--text-muted)]">
                敲門後查看自介、風格、作品與聯絡方式
              </p>
            )}
          </div>
        </div>
      </section>

      {showFullContent ? (
        <CreatorFullContent creator={creator} />
      ) : (
        <CreatorKnockGate creator={publicCreator} />
      )}
    </>
  );
}
