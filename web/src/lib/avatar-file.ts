export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/**
 * 照片仍要經 Server Action 時，必須低於預設約 1MB 的請求上限。
 * 超過時動作會在寫入前被退回，正式環境只顯示一段英文，已填的欄位也跟著不見。
 * 直傳失敗才把較小的檔案塞回表單。
 */
export const AVATAR_SERVER_ACTION_SAFE_BYTES = 600 * 1024;

const AVATAR_EXTS = ["jpg", "png", "webp", "gif"] as const;

export type AvatarExt = (typeof AVATAR_EXTS)[number];

const CONTENT_TYPES: Record<AvatarExt, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function isAvatarExt(value: string): value is AvatarExt {
  return (AVATAR_EXTS as readonly string[]).includes(value);
}

export function avatarObjectPath(userId: string, ext: AvatarExt): string {
  return `${userId}/avatar.${ext}`;
}

export function inferImageContentType(file: { type: string; name: string }): string | null {
  const type = file.type.trim().toLowerCase();
  if (type === "image/jpg" || type === "image/pjpeg") return CONTENT_TYPES.jpg;
  if (type === "image/x-png") return CONTENT_TYPES.png;
  if ((Object.values(CONTENT_TYPES) as string[]).includes(type)) return type;

  const name = file.name.trim().toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return CONTENT_TYPES.jpg;
  if (name.endsWith(".png")) return CONTENT_TYPES.png;
  if (name.endsWith(".webp")) return CONTENT_TYPES.webp;
  if (name.endsWith(".gif")) return CONTENT_TYPES.gif;
  return null;
}

export function extensionForContentType(contentType: string): AvatarExt | null {
  if (contentType === CONTENT_TYPES.jpg) return "jpg";
  if (contentType === CONTENT_TYPES.png) return "png";
  if (contentType === CONTENT_TYPES.webp) return "webp";
  if (contentType === CONTENT_TYPES.gif) return "gif";
  return null;
}

export function validateAvatarFile(file: { type: string; name: string; size: number }):
  | { ok: true; contentType: string; ext: AvatarExt }
  | { ok: false; error: string } {
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: "圖片需小於 5MB" };
  }
  const contentType = inferImageContentType(file);
  const ext = contentType ? extensionForContentType(contentType) : null;
  if (!contentType || !ext) {
    return { ok: false, error: "請上傳 JPG、PNG、WebP 或 GIF" };
  }
  if (file.size <= 0) {
    return { ok: false, error: "這個檔案是空的，請另外選一張照片" };
  }
  return { ok: true, contentType, ext };
}

export function planAvatarSubmit(params: {
  fileSize: number;
  upload: { ext: string } | { error: string } | null;
}): { avatarExt: string | null; sendFile: boolean; photoError: string | null } {
  if (params.fileSize <= 0) {
    return { avatarExt: null, sendFile: false, photoError: null };
  }
  if (!params.upload) {
    return {
      avatarExt: null,
      sendFile: false,
      photoError: "上傳沒有成功，請再選一次照片",
    };
  }
  if ("ext" in params.upload) {
    return { avatarExt: params.upload.ext, sendFile: false, photoError: null };
  }
  if (params.fileSize <= AVATAR_SERVER_ACTION_SAFE_BYTES) {
    return { avatarExt: null, sendFile: true, photoError: null };
  }
  return { avatarExt: null, sendFile: false, photoError: params.upload.error };
}

export function avatarUploadErrorMessage(raw: string): string {
  const message = raw.toLowerCase();
  if (raw.includes("Bucket not found")) {
    return "照片儲存空間尚未就緒，請稍後再試";
  }
  if (
    message.includes("row-level security") ||
    message.includes("not allowed") ||
    message.includes("unauthorized") ||
    message.includes("403")
  ) {
    return "沒有權限上傳這張照片，請重新登入後再試一次";
  }
  if (
    message.includes("too large") ||
    message.includes("payload") ||
    message.includes("exceeded") ||
    message.includes("entity too large")
  ) {
    return "圖片需小於 5MB";
  }
  return "上傳沒有成功，請換一張 JPG、PNG 或 WebP 再試一次";
}

const STUDIO_SAVE_FAILED =
  "儲存沒有完成，請再按一次。已填的內容還在畫面上，不用重打。";

/** Server Action 在正式環境丟出的是英文框架訊息。業務錯誤走 { error }，不會進這裡。 */
export function studioActionFailureMessage(): string {
  return STUDIO_SAVE_FAILED;
}
