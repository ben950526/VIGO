import type { ReactNode } from "react";
import Link from "next/link";
import { LEGAL_CONTACT_PATH, LEGAL_OPERATOR_NAME, TERMS_VERSION } from "@/lib/legal";
import { SITE_NAME } from "@/lib/constants";

interface LegalDocumentProps {
  title: string;
  children: ReactNode;
}

export function LegalDocument({ title, children }: LegalDocumentProps) {
  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-bold">{title}</h1>
        <p className="mb-8 text-sm text-[var(--text-muted)]">
          版本：{TERMS_VERSION} · 營運者：{LEGAL_OPERATOR_NAME}
        </p>
        <div className="prose-legal space-y-6 text-[var(--text-secondary)]">{children}</div>
        <p className="mt-10 text-sm text-[var(--text-muted)]">
          如有疑問，請透過{" "}
          <Link href={LEGAL_CONTACT_PATH} className="text-[var(--accent)] hover:underline">
            意見回饋
          </Link>{" "}
          與我們聯繫。
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            返回 {SITE_NAME} 首頁
          </Link>
        </p>
      </div>
    </section>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-[var(--text)]">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}
