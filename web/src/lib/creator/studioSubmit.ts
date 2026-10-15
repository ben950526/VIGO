import { MIN_PUBLIC_BIO_CHARS } from "@/lib/creator/listing";
import type { CreatorProfile } from "@/types/database";

export type StudioSubmitInput = Pick<
  CreatorProfile,
  "studio_name" | "bio" | "region" | "service_types" | "style_tags" | "contact_email" | "line_id" | "phone"
>;

/** 引導用：還缺哪些工作室欄位。不擋註冊、也不擋審核。 */
export function studioSubmitGaps(input: StudioSubmitInput): string[] {
  const gaps: string[] = [];
  if (!input.studio_name.trim()) gaps.push("工作室名稱");
  if ((input.bio?.trim().length ?? 0) < MIN_PUBLIC_BIO_CHARS) {
    gaps.push(`自我介紹（至少約 ${MIN_PUBLIC_BIO_CHARS} 字）`);
  }
  if (!input.region?.trim()) gaps.push("地區");
  if (!(input.service_types?.length ?? 0)) gaps.push("至少選 1 項服務");
  if (!(input.style_tags?.length ?? 0)) gaps.push("至少選 1 個風格標籤");
  const hasContact = Boolean(
    input.contact_email?.trim() || input.line_id?.trim() || input.phone?.trim(),
  );
  if (!hasContact) gaps.push("至少一種聯絡方式（Email、LINE 或電話）");
  return gaps;
}
