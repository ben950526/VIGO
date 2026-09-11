import type { CreatorProfile } from "@/types/database";
import { UnpublishedText } from "@/components/creator/UnpublishedText";

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      {value ? (
        <p className="font-medium text-[var(--text)]">{value}</p>
      ) : (
        <UnpublishedText className="text-sm" />
      )}
    </div>
  );
}

export function CreatorStudioInfo({ creator }: { creator: CreatorProfile }) {
  return (
    <section className="section bg-[var(--surface)]">
      <div className="container-narrow">
        <h2 className="mb-2 text-2xl font-bold">合作資訊</h2>
        <p className="mb-8 text-sm text-[var(--text-muted)]">
          熟悉平台、適合客戶與服務語言
        </p>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField
            label="熟悉平台"
            value={creator.platforms?.length ? creator.platforms.join("、") : null}
          />
          <InfoField
            label="適合客戶"
            value={creator.client_types?.length ? creator.client_types.join("、") : null}
          />
          <InfoField
            label="語言"
            value={creator.languages?.length ? creator.languages.join("、") : null}
          />
        </div>

        <div className="text-sm">
          <strong>更多作品：</strong>{" "}
          {creator.website_url ? (
            <a
              href={creator.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              {creator.website_url}
            </a>
          ) : (
            <span className="text-[var(--text-muted)]">尚未公布</span>
          )}
        </div>
      </div>
    </section>
  );
}
