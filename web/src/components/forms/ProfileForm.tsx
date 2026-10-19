"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { updateCreatorProfile } from "@/actions/creator";
import { prepareAvatarFile } from "@/lib/image/prepareAvatarFile";
import { uploadAvatarFromBrowser } from "@/lib/image/uploadAvatarFromBrowser";
import { PriceListEditor } from "@/components/forms/PriceListEditor";
import { TagCheckboxGroup } from "@/components/forms/TagCheckboxGroup";
import {
  CLIENT_TYPES,
  LANGUAGES,
  PLATFORMS,
  REGIONS,
  SERVICE_TYPES,
  STYLE_TAGS,
} from "@/lib/constants";
import type { CreatorProfile, PriceListItem } from "@/types/database";
import { parsePriceList } from "@/lib/price-list";

interface ProfileFormProps {
  profile: CreatorProfile;
  /** 嵌入「編輯工作室內容」頁時不顯示頁首 */
  embedded?: boolean;
  justSaved?: boolean;
  exploreGaps?: string[];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-[var(--border)] pb-2 text-lg font-bold text-[var(--text)]">
      {children}
    </h2>
  );
}

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <button type="submit" disabled={pending} className="btn-primary disabled:opacity-70">
      {pending ? "儲存中…" : "儲存資料"}
    </button>
  );
}

function SaveStatus({
  error,
  success,
  exploreGaps,
}: {
  error: string;
  success: boolean;
  exploreGaps: string[];
}) {
  if (!error && !success) return null;
  return (
    <div className="space-y-2">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? (
        <>
          <p className="text-sm text-green-700">已儲存。資料有進去，不是沒反應。</p>
          {exploreGaps.length > 0 ? (
            <p className="text-sm text-amber-800">
              探索頁還不會顯示，還差：{exploreGaps.join("、")}。補上再按一次儲存即可。
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function ProfileForm({
  profile,
  embedded = false,
  justSaved = false,
  exploreGaps = [],
}: ProfileFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(justSaved);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(profile.avatar_url);
  const [priceList, setPriceList] = useState<PriceListItem[]>(
    profile.price_list?.length ? profile.price_list : [],
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(file: File | undefined) {
    if (file) setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(false);
    setPending(true);
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("price_list_json", JSON.stringify(parsePriceList(priceList)));
    formData.delete("avatar");
    const picked = avatarInputRef.current?.files?.[0];
    try {
      let photoError = "";
      if (picked && picked.size > 0) {
        const prepared = await prepareAvatarFile(picked);
        if ("error" in prepared) {
          photoError = prepared.error;
        } else {
          const uploaded = await uploadAvatarFromBrowser(prepared);
          if (!uploaded.ok) {
            photoError = uploaded.error;
          } else {
            formData.set("avatar_storage_path", uploaded.path);
          }
        }
      }
      const result = await updateCreatorProfile(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (photoError) {
        setError(`資料已儲存，但照片沒放上去：${photoError}`);
        setSuccess(true);
        return;
      }
      const next = new URL(window.location.href);
      next.searchParams.set("saved", "1");
      window.location.assign(next.pathname + next.search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗，請再試一次");
    } finally {
      setPending(false);
    }
  }

  const form = (
        <form onSubmit={handleSubmit} noValidate className="space-y-10">
          <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)] py-3 shadow-[0_10px_16px_-14px_rgba(0,0,0,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-secondary)]">
                這一區改完，按「儲存資料」才會寫進工作室。
              </p>
              <SaveButton pending={pending} />
            </div>
            {error || success ? (
              <div className="mt-2">
                <SaveStatus error={error} success={success} exploreGaps={exploreGaps} />
              </div>
            ) : null}
          </div>
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="預覽" className="h-full w-full object-cover" />
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
                    手機相簿可直接選，HEIC 會自動轉成 JPG。加照片不會再把整份儲存打掉。
                  </p>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*,.heic,.heif,image/jpeg,image/png,image/webp,image/gif"
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
              <label className="mb-1 block text-sm font-medium">自我介紹（探索頁至少約 20 字，沒寫會像沒存到）</label>
              <textarea
                className="input min-h-28"
                name="bio"
                placeholder="擅長風格、過往經驗、合作方式（至少約 20 字）"
                defaultValue={profile.bio ?? ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">地區（建議填）</label>
              <select className="input" name="region" defaultValue={profile.region ?? ""}>
                <option value="">請選擇</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">作品集 / 官網連結（選填）</label>
              <input
                className="input"
                name="website_url"
                type="text"
                inputMode="url"
                placeholder="https:// 或 Instagram／官網網址"
                defaultValue={profile.website_url ?? ""}
              />
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle>價目表（選填）</SectionTitle>
            <p className="text-sm text-[var(--text-muted)]">有再填，之後對外介紹會比較順。</p>
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
              legend="風格標籤（建議至少 1 個）"
              options={STYLE_TAGS}
              checkboxNamePrefix="tag_"
              customFieldName="style_tags_custom"
              selectedValues={profile.style_tags ?? []}
            />
            <TagCheckboxGroup
              legend="服務項目（建議至少 1 項）"
              options={SERVICE_TYPES}
              checkboxNamePrefix="service_"
              customFieldName="service_types_custom"
              selectedValues={profile.service_types ?? []}
            />
          </div>

          {/* 聯絡 */}
          <div className="space-y-4">
            <SectionTitle>聯絡方式（建議至少一種）</SectionTitle>
            <input className="input" name="contact_email" type="text" inputMode="email" placeholder="聯絡 Email" defaultValue={profile.contact_email ?? ""} />
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

          <SaveStatus error={error} success={success} exploreGaps={exploreGaps} />
          <SaveButton pending={pending} />
        </form>
  );

  if (embedded) {
    return (
      <div id="profile" className="scroll-mt-8 space-y-4">
        <SectionTitle>工作室資料</SectionTitle>
        <p className="text-sm text-[var(--text-secondary)]">
          填寫發案者最在意的合作資訊，有助提高詢問轉換
        </p>
        {form}
      </div>
    );
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
          表單上方會留著 <strong className="text-[var(--text)]">儲存資料</strong>，改完按下去才會生效。
        </p>
        {form}
      </div>
    </section>
  );
}
