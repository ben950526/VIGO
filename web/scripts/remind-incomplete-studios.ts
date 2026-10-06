/**
 * 找出工作室資料不完整的接案者並列出／寄提醒信
 *
 * cd web
 * npx tsx scripts/remind-incomplete-studios.ts
 * npx tsx scripts/remind-incomplete-studios.ts --send
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { buildIncompleteStudioReminderHtml } from "../src/lib/email/incompleteStudioReminderHtml";

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

const MIN_WORKS = 3;
const MIN_BIO = 40;

function missingParts(row: {
  bio: string | null;
  region: string | null;
  service_types: string[] | null;
  contact_email: string | null;
  line_id: string | null;
  phone: string | null;
  workCount: number;
}): string[] {
  const missing: string[] = [];
  if (!(row.bio?.trim().length ?? 0) || (row.bio?.trim().length ?? 0) < MIN_BIO) {
    missing.push("介紹還太短或空白");
  }
  if (!row.region?.trim()) missing.push("還沒填地區");
  if (!(row.service_types?.length ?? 0)) missing.push("還沒選服務項目");
  const hasContact = Boolean(
    row.contact_email?.trim() || row.line_id?.trim() || row.phone?.trim(),
  );
  if (!hasContact) missing.push("還沒填聯絡方式");
  if (row.workCount < MIN_WORKS) {
    missing.push(`作品不足 ${MIN_WORKS} 支（目前 ${row.workCount}）`);
  }
  return missing;
}

async function main() {
  const send = process.argv.includes("--send");
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
      "id, user_id, slug, studio_name, bio, region, service_types, contact_email, line_id, phone, verification_status, is_listed, is_demo",
    )
    .eq("is_demo", false);

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

  const workCount = new Map<string, number>();
  for (const w of works ?? []) {
    if (w.status === "rejected") continue;
    workCount.set(w.creator_id, (workCount.get(w.creator_id) ?? 0) + 1);
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
    status: string;
    email: string | null;
    missing: string[];
  }[] = [];

  for (const row of creators ?? []) {
    const missing = missingParts({
      bio: row.bio,
      region: row.region,
      service_types: row.service_types,
      contact_email: row.contact_email,
      line_id: row.line_id,
      phone: row.phone,
      workCount: workCount.get(row.id) ?? 0,
    });
    if (missing.length === 0) continue;
    const email =
      (row.contact_email?.trim() || emailByUser.get(row.user_id) || "").toLowerCase() || null;
    incomplete.push({
      studio: row.studio_name,
      slug: row.slug,
      status: row.verification_status,
      email,
      missing,
    });
  }

  console.log(
    JSON.stringify(
      {
        source: serviceKey ? "service" : "anon(僅公開可見列)",
        totalStudios: creators?.length ?? 0,
        incomplete: incomplete.length,
        rows: incomplete,
      },
      null,
      2,
    ),
  );

  if (!send) {
    console.log("未加 --send，只列出、不寄信");
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

  for (const row of incomplete) {
    if (!row.email || row.email.endsWith("@vigo.local")) continue;
    if (row.email === "benten950526@gmail.com") continue;
    if (row.email === "f@gmail.com") continue;
    const { error: sendError } = await resend.emails.send({
      from,
      to: row.email,
      subject: `【Vigo】${row.studio} 還差一點，補一下會比較容易被看到`,
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
      console.log("已寄", row.email, row.studio);
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log({ sent, failed, skippedNoEmail: incomplete.filter((r) => !r.email).length });
}

void main();
