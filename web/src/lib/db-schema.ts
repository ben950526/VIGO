import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/utils";

const EXTENDED_COLUMNS = [
  "client_types",
  "platforms",
  "languages",
  "price_list",
  "revision_policy",
  "typical_scope",
] as const;

async function probeCreatorProfileSchema(): Promise<{
  ok: boolean;
  missingColumn?: string;
}> {
  if (!isSupabaseConfigured()) return { ok: true };

  const supabase = createPublicClient();
  const { error } = await supabase
    .from("creator_profiles")
    .select(EXTENDED_COLUMNS.join(", "))
    .limit(1);

  if (!error) return { ok: true };

  const match = error.message.match(/'(\w+)' column/);
  return {
    ok: false,
    missingColumn: match?.[1] ?? "unknown",
  };
}

export async function checkCreatorProfileSchema(): Promise<{
  ok: boolean;
  missingColumn?: string;
}> {
  return unstable_cache(probeCreatorProfileSchema, ["creator-profile-schema"], {
    revalidate: 3600,
  })();
}

export function formatSchemaError(message: string): string | null {
  if (
    message.includes("client_types") ||
    message.includes("platforms") ||
    message.includes("languages") ||
    message.includes("price_list") ||
    message.includes("revision_policy") ||
    message.includes("typical_scope") ||
    message.includes("schema cache")
  ) {
    return "資料庫尚未更新。請到 Supabase → SQL Editor，執行專案中的 supabase/RUN_ONCE.sql（只需一次），完成後重新整理此頁再儲存。";
  }
  return null;
}
