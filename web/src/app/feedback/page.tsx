import { Suspense } from "react";
import Link from "next/link";
import { FeedbackForm } from "@/components/forms/FeedbackForm";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: "意見回饋",
  description: `給 ${SITE_NAME} 一點建議，我們會高度採納您的意見。`,
};

export default function FeedbackPage() {
  return (
    <section className="section">
      <div className="container-narrow max-w-xl">
        <Link href="/" className="mb-6 inline-block text-sm text-[var(--accent)]">
          ← 返回首頁
        </Link>

        <h1 className="mb-3 text-3xl font-bold">給 Vigo 一點建議</h1>
        <p className="mb-2 text-[var(--text-secondary)]">
          <strong className="text-[var(--text)]">你的每一則意見都會被認真閱讀，並高度採納到平台改版中</strong>——不會白填。
        </p>
        <p className="mb-8 text-sm text-[var(--text-muted)]">
          不用寫長文，手打幾句話告訴我們哪裡好用、哪裡想改就好。
        </p>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-[var(--border)]" />}>
          <FeedbackForm />
        </Suspense>
      </div>
    </section>
  );
}
