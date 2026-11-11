import Image from "next/image";
import { notFound } from "next/navigation";
import { CreatorFullContent } from "@/components/creator/CreatorFullContent";
import { CreatorKnockGate } from "@/components/creator/CreatorKnockGate";
import { DemoAccountBanner } from "@/components/creator/DemoAccountBanner";
import { DemoBadge } from "@/components/creator/DemoBadge";
import { RecordStudioPageView } from "@/components/creator/RecordStudioPageView";
import { StudioPreviewBanner } from "@/components/creator/StudioPreviewBanner";
import { isClientLoginRequired } from "@/lib/auth/clientGate";
import { getAuthUserId } from "@/lib/auth/session";
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
  const c = page.creator;
  // 搜尋結果會顯示的說明：地區、服務、風格，讓搜「台中 Reels 剪輯」的人看得出相關
  const facts = [c.region, ...(c.service_types ?? []).slice(0, 3), ...(c.style_tags ?? []).slice(0, 3)]
    .filter(Boolean)
    .join("・");
  const bio = (c.bio ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  return {
    title: `${c.studio_name}｜短影音作品集`,
    description: [facts, bio, "在 Vigo 先看作品，對到風格再聯絡，不抽成。"].filter(Boolean).join("。"),
    alternates: { canonical: `/creator/${slug}` },
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
  const showContact = isPreview || isDemo || knocked;
  // 逛作品不用登入；開關打開時，沒登入的人要先登入才能敲門
  const knockLoginHref =
    !showContact && isClientLoginRequired() && !(await getAuthUserId())
      ? `/join?next=${encodeURIComponent(`/creator/${slug}`)}`
      : undefined;

  return (
    <>
      {previewReason && <StudioPreviewBanner reason={previewReason} />}
      {!isPreview && !isDemo ? <RecordStudioPageView creatorId={creator.id} /> : null}
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
            {!showContact && (
              <p className="text-sm text-[var(--text-muted)]">
                先看作品；對到風格再敲門，才會看到聯絡方式
              </p>
            )}
          </div>
        </div>
      </section>

      <CreatorFullContent
        creator={creator}
        previewMode={isPreview}
        lockContact={!showContact}
      />
      {!showContact ? <CreatorKnockGate creator={publicCreator} loginHref={knockLoginHref} /> : null}
    </>
  );
}
