import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/** 公开只读查询用，不读 cookies，可安全放进 unstable_cache */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
