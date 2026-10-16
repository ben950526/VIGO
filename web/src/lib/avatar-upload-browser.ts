import {
  avatarObjectPath,
  avatarUploadErrorMessage,
  validateAvatarFile,
} from "@/lib/avatar-file";
import { createClient } from "@/lib/supabase/client";

/** 照片直傳儲存空間，避免塞進 Server Action 時超過約 1MB、整份工作室資料一起被退回。 */
export async function uploadAvatarInBrowser(
  file: File,
): Promise<{ ext: string } | { error: string }> {
  const checked = validateAvatarFile(file);
  if (!checked.ok) return { error: checked.error };

  const supabase = createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return { error: "請重新登入後再上傳照片" };
  }

  const path = avatarObjectPath(data.user.id, checked.ext);
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: checked.contentType,
    upsert: true,
  });
  if (error) return { error: avatarUploadErrorMessage(error.message) };
  return { ext: checked.ext };
}
