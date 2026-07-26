import { Suspense } from "react";
import Link from "next/link";
import { BugReportForm } from "@/components/forms/BugReportForm";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: "回報 BUG",
  description: `向 ${SITE_NAME} 回報問題，我們會專人排查並盡快修復。`,
};

export default function ReportBugPage() {
  return (
    <section className="section">
      <div className="container-narrow max-w-xl">
        <Link href="/" className="mb-6 inline-block text-sm text-[var(--accent)]">
          ← 返回首頁
        </Link>

        <h1 className="mb-3 text-3xl font-bold">回報 BUG</h1>
        <p className="mb-2 text-[var(--text-secondary)]">
          遇到問題了嗎？<strong className="text-[var(--text)]">我們會專人排查並盡快修復</strong>，你的回報不會石沉大海。
        </p>
        <p className="mb-8 text-sm text-[var(--text-muted)]">
          簡單描述狀況即可，若記得操作步驟也請一併告訴我們。
        </p>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-[var(--border)]" />}>
          <BugReportForm />
        </Suspense>
      </div>
    </section>
  );
}
