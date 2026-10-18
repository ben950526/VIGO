/**
 * 已通過但還沒上探索頁的工作室：只依探索頁門檻（約 20 字介紹 + 1 支已過審作品）
 *
 * cd web
 * npx tsx scripts/remind-incomplete-studios.ts
 * npx tsx scripts/remind-incomplete-studios.ts --send --closest  # 只寄最接近的 10 間
 * npx tsx scripts/remind-incomplete-studios.ts --send           # 全部尚未上探索頁（已過審）
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { buildIncompleteStudioReminderHtml } from "../src/lib/email/incompleteStudioReminderHtml";
import {
  EXPLORE_UNBLOCK_FOCUS_LIMIT,
  compareExploreUnblockKind,
  exploreUnblockKind,
  studioExploreContentGaps,
} from "../src/lib/creator/listing";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env: Record<string, string> = {};
try {
  const text = readFileSync(resolve(root, ".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
} catch {
  console.error("讀不到 .env.local");
  process.exit(1);
}

async function main() {
  const send = process.argv.includes("--send");
  const closestOnly = process.argv.includes("--closest");
  const url = (process.env.VIGO_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceKey = (process.env.VIGO_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const anonKey = (process.env.VIGO_SUPABASE_ANON || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const key = serviceKey || anonKey;
  if (!url || !key) {
    console.error("缺少 Supabase 網址或金鑰");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: creators, error } = await supabase
    .from("creator_profiles")
    .select(
      "id, user_id, slug, studio_name, bio, contact_email, verification_status, is_listed, is_demo",
    )
    .eq("is_demo", false)
    .eq("verification_status", "approved")
    .neq("is_listed", false);

  if (error) {
    console.error("讀工作室失敗:", error.message);
    process.exit(1);
  }

  const ids = (creators ?? []).map((c) => c.id);
  const { data: works, error: workError } = await supabase
    .from("portfolio_items")
    .select("id, creator_id, status")
    .in("creator_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  if (workError) {
    console.error("讀作品失敗:", workError.message);
    process.exit(1);
  }

  const approvedWorkCount = new Map<string, number>();
  for (const w of works ?? []) {
    if (w.status !== "approved") continue;
    approvedWorkCount.set(w.creator_id, (approvedWorkCount.get(w.creator_id) ?? 0) + 1);
  }

  const emailByUser = new Map<string, string>();
  if (serviceKey) {
    const userIds = [...new Set((creators ?? []).map((c) => c.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds);
    for (const p of profiles ?? []) {
      if (p.email?.trim()) emailByUser.set(p.id, p.email.trim());
    }
  }

  const incomplete: {
    studio: string;
    slug: string;
    email: string | null;
    missing: string[];
    kind: "bio_only" | "work_only" | "both";
  }[] = [];

  for (const row of creators ?? []) {
    const input = {
      bio: row.bio,
      approvedWorkCount: approvedWorkCount.get(row.id) ?? 0,
    };
    const missing = studioExploreContentGaps(input);
    if (missing.length === 0) continue;
    const kind = exploreUnblockKind(input) ?? "both";
    const email =
      (row.contact_email?.trim() || emailByUser.get(row.user_id) || "").toLowerCase() || null;
    incomplete.push({
      studio: row.studio_name,
      slug: row.slug,
      email,
      missing,
      kind,
    });
  }

  incomplete.sort((a, b) => compareExploreUnblockKind(a.kind, b.kind));
  const focus = incomplete.slice(0, EXPLORE_UNBLOCK_FOCUS_LIMIT);
  const toSend = closestOnly ? focus : incomplete;

  console.log(
    JSON.stringify(
      {
        source: serviceKey ? "service" : "anon(僅公開可見列)",
        totalApprovedListed: creators?.length ?? 0,
        incomplete: incomplete.length,
        focus: focus.length,
        closestOnly,
        rows: incomplete,
      },
      null,
      2,
    ),
  );

  if (!send) {
    console.log("未加 --send，只列出、不寄信。加 --send 會寄給全部尚未上探索頁者；加 --closest 才只寄 10 間。");
    return;
  }

  const apiKey = (process.env.VIGO_MAIL_KEY || env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    console.error("沒有寄信金鑰");
    process.exit(1);
  }

  const from = env.EMAIL_FROM?.trim() || "Vigo <notify@mail.try-vigo.com>";
  const baseUrl = "https://vigo-woad.vercel.app";
  const resend = new Resend(apiKey);
  let sent = 0;
  let failed = 0;

  for (const row of toSend) {
    if (!row.email || row.email.endsWith("@vigo.local")) continue;
    if (row.email === "benten950526@gmail.com") continue;
    if (row.email === "f@gmail.com") continue;
    const { error: sendError } = await resend.emails.send({
      from,
      to: row.email,
      subject: `【Vigo】${row.studio} 還差一點，補了就會出現在探索頁`,
      html: buildIncompleteStudioReminderHtml({
        studioName: row.studio,
        missing: row.missing,
        studioEditUrl: `${baseUrl}/dashboard/studio`,
        dashboardUrl: `${baseUrl}/dashboard`,
      }),
    });
    if (sendError) {
      console.error("寄送失敗", row.email, sendError.message);
      failed += 1;
    } else {
      sent += 1;
      console.log("已寄", row.email, row.studio, row.kind);
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log({ sent, failed, skippedNoEmail: toSend.filter((r) => !r.email).length });
}

void main();
