import type { CreatorProfile } from "@/types/database";
import { formatPriceTWD } from "@/lib/price-list";
import { UnpublishedText } from "@/components/creator/UnpublishedText";

export function CreatorPriceList({ creator }: { creator: CreatorProfile }) {
  const items = creator.price_list ?? [];

  return (
    <section className="section">
      <div className="container-narrow max-w-2xl">
        <h2 className="mb-2 text-2xl font-bold">價目表</h2>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          以下為創作者自行填寫的參考報價，實際費用依案型與需求另行確認
        </p>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center">
            <UnpublishedText />
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            {items.map((item, index) => (
              <li
                key={`${item.label}-${index}`}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${
                  index > 0 ? "border-t border-[var(--border)]" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-[var(--text)]">{item.label}</p>
                  {item.note && (
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{item.note}</p>
                  )}
                </div>
                <p className="shrink-0 text-lg font-bold text-[var(--accent)]">
                  {formatPriceTWD(item.price)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
