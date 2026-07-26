import { UnpublishedText } from "@/components/creator/UnpublishedText";
import { DEMO_WARNING, isDemoCreator } from "@/lib/demo-creator";
import type { CreatorProfile } from "@/types/database";

interface ContactSectionProps {
  creator: CreatorProfile;
}

export function ContactSection({ creator }: ContactSectionProps) {
  if (isDemoCreator(creator)) {
    return (
      <section className="section bg-[var(--surface)]">
        <div className="container-narrow mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-bold">聯絡方式</h2>
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-6 text-left text-sm text-amber-950">
            <p className="font-semibold">⚠️ 示範帳號 — 不提供聯絡方式</p>
            <p className="mt-2">{DEMO_WARNING}</p>
            <p className="mt-3 text-[var(--text-muted)]">
              若要找真實創作者合作，請回到{" "}
              <a href="/explore" className="text-[var(--accent)] hover:underline">
                探索頁
              </a>{" "}
              選擇未標示「示範帳號」的工作室。
            </p>
          </div>
        </div>
      </section>
    );
  }

  const hasEmail = creator.show_email && creator.contact_email;
  const hasLine = creator.show_line && creator.line_id;
  const hasPhone = creator.show_phone && creator.phone;
  const hasContact = hasEmail || hasLine || hasPhone;

  return (
    <section className="section bg-[var(--surface)]">
      <div className="container-narrow mx-auto max-w-2xl text-center">
        <h2 className="mb-3 text-3xl font-bold">聯絡 {creator.studio_name}</h2>
        <p className="mb-8 text-[var(--text-secondary)]">
          看準風格了？透過以下方式直接聯繫，後續於站外自行洽談。
        </p>

        {hasContact ? (
          <div className="space-y-3 text-left">
            {hasEmail && (
              <p>
                <strong>Email：</strong>{" "}
                <a
                  href={`mailto:${creator.contact_email}`}
                  className="text-[var(--accent)] hover:underline"
                >
                  {creator.contact_email}
                </a>
              </p>
            )}
            {hasLine && (
              <p>
                <strong>LINE ID：</strong> {creator.line_id}
              </p>
            )}
            {hasPhone && (
              <p>
                <strong>電話：</strong>{" "}
                <a href={`tel:${creator.phone}`} className="text-[var(--accent)] hover:underline">
                  {creator.phone}
                </a>
              </p>
            )}
          </div>
        ) : (
          <UnpublishedText />
        )}
        <p className="mt-8 text-xs text-[var(--text-muted)]">
          Vigo 僅提供媒合資訊，不介入雙方交易、付款或履約；請自行評估合作風險並保留溝通紀錄。
        </p>
      </div>
    </section>
  );
}
