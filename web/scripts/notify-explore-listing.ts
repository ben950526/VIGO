/**
 * 通知接案者：探索頁改為需有介紹與至少 1 支已通過作品才會露出
 *
 * cd web
 * npx tsx scripts/notify-explore-listing.ts
 * npx tsx scripts/notify-explore-listing.ts --send
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  isStudioContentReadyForExplore,
} from "../src/lib/creator/listing";
import {
  EXPLORE_LISTING_NOTICE_SUBJECT,
  buildExploreListingNoticeHtml,
} from "../src/lib/email/exploreListingNoticeHtml";

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

const SKIP_EMAILS = new Set([
  "f@gmail.com",
  "benten950526@gmail.com",
]);

function shouldSkipEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (SKIP_EMAILS.has(lower)) return true;
  if (lower.endsWith("@vigo.local")) return true;
  if (lower.startsWith("demo-")) return true;
  return false;
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
      "id, user_id, slug, studio_name, bio, contact_email, verification_status, is_listed, is_demo",
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

  const approvedCount = new Map<string, number>();
  for (const w of works ?? []) {
    if (w.status !== "approved") continue;
    approvedCount.set(w.creator_id, (approvedCount.get(w.creator_id) ?? 0) + 1);
  }

  const emailByUser = new Map<string, string>();
  if (serviceKey) {
    const userIds = [...new Set((creators ?? []).map((c) => c.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds);
    for (const p of profiles ?? []) {
      if (p.email?.trim()) emailByUser.set(p.id, p.email.trim());
    }
  }

  const recipients: {
    studio: string;
    slug: string;
    email: string;
    alreadyVisible: boolean;
  }[] = [];

  for (const row of creators ?? []) {
    const email =
      (row.contact_email?.trim() || emailByUser.get(row.user_id) || "").toLowerCase();
    if (!email || shouldSkipEmail(email)) continue;
    const alreadyVisible =
      row.verification_status === "approved" &&
      row.is_listed !== false &&
      isStudioContentReadyForExplore({
        bio: row.bio,
        approvedWorkCount: approvedCount.get(row.id) ?? 0,
      });
    recipients.push({
      studio: row.studio_name,
      slug: row.slug,
      email,
      alreadyVisible,
    });
  }

  const unique = new Map<string, (typeof recipients)[number]>();
  for (const r of recipients) {
    if (!unique.has(r.email)) unique.set(r.email, r);
  }
  const list = [...unique.values()];

  console.log(
    JSON.stringify(
      {
        source: serviceKey ? "service" : "anon",
        totalStudios: creators?.length ?? 0,
        recipientCount: list.length,
        alreadyVisible: list.filter((r) => r.alreadyVisible).length,
        notYetVisible: list.filter((r) => !r.alreadyVisible).length,
        rows: list.map((r) => ({
          studio: r.studio,
          email: r.email,
          alreadyVisible: r.alreadyVisible,
        })),
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

  for (const row of list) {
    const { error: sendError } = await resend.emails.send({
      from,
      to: row.email,
      subject: EXPLORE_LISTING_NOTICE_SUBJECT,
      html: buildExploreListingNoticeHtml({
        studioName: row.studio,
        alreadyVisible: row.alreadyVisible,
        studioEditUrl: `${baseUrl}/dashboard/studio`,
        dashboardUrl: `${baseUrl}/dashboard`,
      }),
    });
    if (sendError) {
      console.error("寄送失敗", row.email, sendError.message);
      failed += 1;
    } else {
      sent += 1;
      console.log("已寄", row.email, row.studio, row.alreadyVisible ? "已露出" : "尚未露出");
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log({ sent, failed });
}

void main();
