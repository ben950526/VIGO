"use client";

import Image from "next/image";
import Link from "next/link";
import { ClickToPlayVideo } from "@/components/creator/ClickToPlayVideo";
import {
  AdminReviewField,
  AdminReviewSection,
  AdminReviewTagList,
} from "@/components/admin/AdminReviewFields";
import { formatPriceTWD } from "@/lib/price-list";
import type { PendingCreator } from "@/lib/data/admin";
import { formatPriceRange } from "@/lib/utils";

export function AdminPendingCreatorPreview({ creator }: { creator: PendingCreator }) {
  const priceRange = formatPriceRange(creator.price_min, creator.price_max);
  const pendingWorks = creator.portfolio_items.filter((item) => item.status === "pending");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]">
          {creator.avatar_url ? (
            <Image
              src={creator.avatar_url}
              alt={creator.studio_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--text-muted)]">
              {creator.studio_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/creator/${creator.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            在新分頁開完整預覽 →
          </Link>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            註冊／送審時間：{new Date(creator.created_at).toLocaleString("zh-TW")}
          </p>
        </div>
      </div>

      <AdminReviewSection title="基本資料">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminReviewField label="地區" value={creator.region} />
          <AdminReviewField label="交件速度" value={creator.turnaround} />
          <AdminReviewField
            label="參考報價"
            value={priceRange ?? undefined}
            empty="未填"
          />
          <AdminReviewField label="團隊規模" value={creator.team_size} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AdminReviewTagList label="風格標籤" tags={creator.style_tags} />
          <AdminReviewTagList label="服務項目" tags={creator.service_types} />
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">自介</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
            {creator.bio?.trim() ? creator.bio : "未填"}
          </p>
        </div>
      </AdminReviewSection>

      <AdminReviewSection title="聯絡方式（僅管理員可見）">
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminReviewField
            label={`Email${creator.show_email ? "" : "（不公開）"}`}
            value={creator.contact_email}
          />
          <AdminReviewField
            label={`LINE${creator.show_line ? "" : "（不公開）"}`}
            value={creator.line_id}
          />
          <AdminReviewField
            label={`電話${creator.show_phone ? "" : "（不公開）"}`}
            value={creator.phone}
          />
        </div>
      </AdminReviewSection>

      <AdminReviewSection title="合作資訊">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AdminReviewField label="修改政策" value={creator.revision_policy} />
          <AdminReviewField label="回覆速度" value={creator.response_time} />
          <AdminReviewField
            label="熟悉平台"
            value={creator.platforms.length ? creator.platforms.join("、") : undefined}
          />
          <AdminReviewField
            label="適合客戶"
            value={creator.client_types.length ? creator.client_types.join("、") : undefined}
          />
          <AdminReviewField
            label="語言"
            value={creator.languages.length ? creator.languages.join("、") : undefined}
          />
          <AdminReviewField label="作品網站" value={creator.website_url} />
        </div>
        {creator.typical_scope?.trim() && (
          <div className="mt-4">
            <AdminReviewField label="常接案內容" value={creator.typical_scope} />
          </div>
        )}
      </AdminReviewSection>

      {(creator.price_list?.length ?? 0) > 0 && (
        <AdminReviewSection title="價目表">
          <ul className="overflow-hidden rounded-xl border border-[var(--border)]">
            {creator.price_list.map((item, index) => (
              <li
                key={`${item.label}-${index}`}
                className={`flex items-start justify-between gap-4 px-4 py-3 text-sm ${
                  index > 0 ? "border-t border-[var(--border)]" : ""
                }`}
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  {item.note && (
                    <p className="mt-1 text-[var(--text-muted)]">{item.note}</p>
                  )}
                </div>
                <p className="shrink-0 font-bold text-[var(--accent)]">
                  {formatPriceTWD(item.price)}
                </p>
              </li>
            ))}
          </ul>
        </AdminReviewSection>
      )}

      <AdminReviewSection title={`作品預覽（待審 ${pendingWorks.length} 件）`}>
        {creator.portfolio_items.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">尚未上傳作品</p>
        ) : (
          <ul className="space-y-6">
            {creator.portfolio_items.map((item) => (
              <li
                key={item.id}
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]"
              >
                <div className="p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : item.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  {item.description?.trim() && (
                    <p className="mb-3 text-sm text-[var(--text-secondary)]">
                      {item.description}
                    </p>
                  )}
                  {item.style_tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {item.style_tags.map((tag) => (
                        <span key={tag} className="tag text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ClickToPlayVideo
                  embedType={item.embed_type}
                  embedUrl={item.embed_url}
                  title={item.title}
                  thumbnailUrl={item.thumbnail_url}
                />
              </li>
            ))}
          </ul>
        )}
      </AdminReviewSection>
    </div>
  );
}
