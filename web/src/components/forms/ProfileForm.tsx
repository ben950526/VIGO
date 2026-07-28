"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { updateCreatorProfile } from "@/actions/creator";
import { PriceListEditor } from "@/components/forms/PriceListEditor";
import { TagCheckboxGroup } from "@/components/forms/TagCheckboxGroup";
import {
  CLIENT_TYPES,
  LANGUAGES,
  PLATFORMS,
  REGIONS,
  REVISION_OPTIONS,
  RESPONSE_TIME_OPTIONS,
  SERVICE_TYPES,
  STYLE_TAGS,
  TEAM_SIZES,
} from "@/lib/constants";
import type { CreatorProfile, PriceListItem } from "@/types/database";
import { parsePriceList } from "@/lib/price-list";

interface ProfileFormProps {
  profile: CreatorProfile;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-[var(--border)] pb-2 text-lg font-bold text-[var(--text)]">
      {children}
    </h2>
  );
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(profile.avatar_url);
  const [priceList, setPriceList] = useState<PriceListItem[]>(
    profile.price_list?.length ? profile.price_list : [],
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(file: File | undefined) {
    if (file) setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(formData: FormData) {
    setSuccess(false);
    setPending(true);
    setError("");
    formData.set("price_list_json", JSON.stringify(parsePriceList(priceList)));
    try {
      const result = await updateCreatorProfile(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section">
      <div className="container-narrow max-w-2xl">
        <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--accent)]">
          ← 返回我的工作室
        </Link>
        <h1 className="mb-2 text-3xl font-bold">編輯工作室資料</h1>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          填寫發案者最在意的合作資訊，有助提高詢問轉換
        </p>
        <p className="mb-8 rounded-xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          修改完記得捲到最下方，按 <strong className="text-[var(--text)]">儲存</strong> 才會生效。
        </p>

        <form action={handleSubmit} className="space-y-10">
          {/* 基本 */}
          <div className="space-y-4">
            <SectionTitle>基本資料</SectionTitle>
            <div>
              <label className="mb-2 block text-sm font-medium">自介照片</label>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-[var(--border)] bg-slate-100 transition-colors hover:border-[var(--accent)]"
                  aria-label="上傳自介照片"
                >
                  {preview ? (
                    <Image src={preview} alt="預覽" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-400">
                      {profile.studio_name.charAt(0)}
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                    更換
                  </span>
                </button>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="btn-secondary text-sm"
                  >
                    上傳照片
                  </button>
                  <p className="text-xs text-[var(--text-muted)]">
                    支援 JPG、PNG、WebP，最大 5MB
                  </p>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">工作室名稱</label>
              <input className="input" name="studio_name" placeholder="例如：Reel Lab 短影工作室" defaultValue={profile.studio_name} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">自我介紹</label>
              <textarea className="input min-h-28" name="bio" placeholder="擅長風格、過往經驗、合作方式..." defaultValue={profile.bio ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">地區（選填）</label>
              <select className="input" name="region" defaultValue={profile.region ?? ""}>
                <option value="">請選擇</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">作品集 / 官網連結（選填）</label>
              <input className="input" name="website_url" type="url" placeholder="https://" defaultValue={profile.website_url ?? ""} />
            </div>
          </div>

          {/* 發案者在意 */}
          <div className="space-y-4">
            <SectionTitle>合作條件（發案者最在意）</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">修改政策</label>
                <select className="input" name="revision_policy" defaultValue={profile.revision_policy ?? ""}>
                  <option value="">請選擇</option>
                  {REVISION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">回覆速度</label>
                <select className="input" name="response_time" defaultValue={profile.response_time ?? ""}>
                  <option value="">請選擇</option>
                  {RESPONSE_TIME_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">團隊規模</label>
                <select className="input" name="team_size" defaultValue={profile.team_size ?? ""}>
                  <option value="">請選擇</option>
                  {TEAM_SIZES.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm">常接案內容</label>
              <textarea
                className="input min-h-24"
                name="typical_scope"
                placeholder="例如：15–60 秒 Reels、電商開箱 3–5 支/月、含腳本與拍攝..."
                defaultValue={profile.typical_scope ?? ""}
              />
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle>價目表</SectionTitle>
            <PriceListEditor items={priceList} onChange={setPriceList} />
          </div>

          {/* 標籤 */}
          <div className="space-y-4">
            <SectionTitle>工作室標籤</SectionTitle>
            <TagCheckboxGroup
              legend="熟悉平台"
              options={PLATFORMS}
              checkboxNamePrefix="platform_"
              customFieldName="platforms_custom"
              selectedValues={profile.platforms ?? []}
            />
            <TagCheckboxGroup
              legend="適合客戶類型"
              options={CLIENT_TYPES}
              checkboxNamePrefix="client_"
              customFieldName="client_types_custom"
              selectedValues={profile.client_types ?? []}
            />
            <TagCheckboxGroup
              legend="服務語言"
              options={LANGUAGES}
              checkboxNamePrefix="lang_"
              customFieldName="languages_custom"
              selectedValues={profile.languages ?? []}
            />
            <TagCheckboxGroup
              legend="風格標籤"
              options={STYLE_TAGS}
              checkboxNamePrefix="tag_"
              customFieldName="style_tags_custom"
              selectedValues={profile.style_tags}
            />
            <TagCheckboxGroup
              legend="服務項目"
              options={SERVICE_TYPES}
              checkboxNamePrefix="service_"
              customFieldName="service_types_custom"
              selectedValues={profile.service_types}
            />
          </div>

          {/* 聯絡 */}
          <div className="space-y-4">
            <SectionTitle>聯絡方式</SectionTitle>
            <input className="input" name="contact_email" type="email" placeholder="聯絡 Email" defaultValue={profile.contact_email ?? ""} />
            <div>
              <label className="mb-1 block text-sm font-medium">LINE ID</label>
              <input className="input" name="line_id" placeholder="@yourline" defaultValue={profile.line_id ?? ""} />
            </div>
            <input className="input" name="phone" placeholder="電話" defaultValue={profile.phone ?? ""} />
            <div className="flex flex-wrap gap-4 text-sm">
              <label><input type="checkbox" name="show_email" defaultChecked={profile.show_email} /> 顯示 Email</label>
              <label><input type="checkbox" name="show_line" defaultChecked={profile.show_line} /> 顯示 LINE ID</label>
              <label><input type="checkbox" name="show_phone" defaultChecked={profile.show_phone} /> 顯示電話</label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">已儲存，等待審核後公開。</p>}
          <button type="submit" disabled={pending} className="btn-primary disabled:opacity-70">
            {pending ? "儲存中…" : "儲存"}
          </button>
        </form>
      </div>
    </section>
  );
}
