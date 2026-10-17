import { createClient } from "@/lib/supabase/client";

/** 照片直接上傳到 Supabase，不經過 Server Action，才不會觸發約 1MB 上限變成紅色英文 */
export async function uploadAvatarFromBrowser(
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "請先登入" };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      return { ok: false, error: "儲存空間尚未建立，請稍後再試" };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, path };
}
