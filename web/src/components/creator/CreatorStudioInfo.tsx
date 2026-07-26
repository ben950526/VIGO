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
          發案者最常確認的項目：修改、回覆、平台與適合案型
        </p>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="修改政策" value={creator.revision_policy} />
          <InfoField label="回覆速度" value={creator.response_time} />
          <InfoField label="團隊規模" value={creator.team_size} />
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

        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
          <p className="mb-2 text-sm font-medium text-[var(--text-muted)]">常接案內容</p>
          {creator.typical_scope ? (
            <p className="whitespace-pre-wrap text-[var(--text-secondary)]">
              {creator.typical_scope}
            </p>
          ) : (
            <UnpublishedText className="text-sm" />
          )}
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
