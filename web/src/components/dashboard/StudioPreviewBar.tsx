import Link from "next/link";

interface StudioPreviewBarProps {
  slug: string;
}

export function StudioPreviewBar({ slug }: StudioPreviewBarProps) {
  return (
    <div className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="mb-3 text-sm font-medium text-[var(--text)]">公開頁預覽</p>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        儲存資料或新增作品後，到預覽頁確認排版與播放效果，不必等審核通過才發現問題。
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/preview" className="btn-primary text-sm">
          預覽敲門後（完整內容）
        </Link>
        <Link href="/dashboard/preview?view=knock" className="btn-secondary text-sm">
          預覽敲門前
        </Link>
        <Link
          href={`/creator/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm"
        >
          另開 /creator/{slug}
        </Link>
      </div>
    </div>
  );
}
