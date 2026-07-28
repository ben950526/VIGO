import Link from "next/link";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { SITE_NAME } from "@/lib/constants";
import { getFeaturedCreators } from "@/lib/data/creators";

export const revalidate = 60;

export default async function HomePage() {
  const featured = await getFeaturedCreators();

  return (
    <>
      <section className="relative flex min-h-[85vh] items-center justify-center px-6 text-center">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,247,250,0.88), rgba(195,207,226,0.82)), url('https://picsum.photos/id/1015/1920/1080')",
          }}
        />
        <div>
          <span className="mb-4 inline-block rounded-full bg-[var(--accent-soft)] px-4 py-1 text-sm font-medium text-[var(--accent)]">
            短影音接案 · 被動曝光
          </span>
          <h1 className="mb-4 text-4xl font-bold text-[var(--text)] md:text-5xl">
            找到適合你的<span className="text-[var(--accent)]"> 短影音創作者</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-[var(--text-secondary)]">
            發案者像逛店一樣挑風格；接案者上架作品集，不用搶案、不用花點數。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/explore" className="btn-primary">
              探索創作者
            </Link>
            <Link href="/register" className="btn-secondary">
              我是接案者，免費加入
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow">
          <h2 className="mb-3 text-center text-3xl font-bold">精選創作者</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-[var(--text-secondary)]">
            先看作品、再決定是否聯絡。
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {featured.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow">
          <h2 className="mb-3 text-center text-3xl font-bold">{SITE_NAME} 特色</h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-[var(--text-secondary)]">
            不用搶案、不用比價競標，發案與接案都更直覺。
          </p>
          <div className="grid gap-10 md:grid-cols-3">
          {[
            {
              title: "接案者：被動曝光",
              desc: "建立工作室頁、嵌入 YouTube / Reels 作品，等發案者主動聯絡。",
            },
            {
              title: "發案者：逛店式選人",
              desc: "依風格、地區、服務篩選，滿意再透過 Email / LINE 直接聯繫。",
            },
            {
              title: "平台：初期全免費",
              desc: "種子創作者免費上架；穩定後推出 Pro 曝光方案。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]"
            >
              <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
              <p className="text-[var(--text-secondary)]">{item.desc}</p>
            </div>
          ))}
          </div>
        </div>
      </section>
    </>
  );
}
