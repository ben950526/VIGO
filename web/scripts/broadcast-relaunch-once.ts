/**
 * 單次「重出江湖」公告信（Resend）
 *
 * cd web
 * npx tsx scripts/broadcast-relaunch-once.ts --dry-run
 * npx tsx scripts/broadcast-relaunch-once.ts --dry-run --only-approved
 * npx tsx scripts/broadcast-relaunch-once.ts --to=you@example.com --send
 * npx tsx scripts/broadcast-relaunch-once.ts --to=you@example.com --force-test-to --send
 * npx tsx scripts/broadcast-relaunch-once.ts --send --only-approved
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

try {
  const text = readFileSync(envPath, "utf8");
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
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
} catch {
  console.warn("No .env.local — 請確認 RESEND_API_KEY、SUPABASE_SERVICE_ROLE_KEY 已設定");
}

function parseArgs(argv: string[]) {
  const dryRun = !argv.includes("--send");
  const onlyApproved = argv.includes("--only-approved");
  const forceTestTo = argv.includes("--force-test-to");
  let testTo: string | undefined;
  let delayMs = 550;

  for (const arg of argv) {
    if (arg.startsWith("--to=")) testTo = arg.slice("--to=".length);
    if (arg.startsWith("--delay-ms=")) {
      const n = Number(arg.slice("--delay-ms=".length));
      if (Number.isFinite(n) && n >= 0) delayMs = n;
    }
  }

  return { dryRun, onlyApproved, testTo, forceTestTo, delayMs };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.dryRun) {
    console.warn("⚠️  即將真正寄信（--send）。10 秒內 Ctrl+C 可取消…");
    await new Promise((r) => setTimeout(r, 10_000));
  }

  const { runRelaunchBroadcast } = await import("../src/lib/email/runRelaunchBroadcast");
  const result = await runRelaunchBroadcast({
    dryRun: opts.dryRun,
    testTo: opts.testTo,
    forceTestTo: opts.forceTestTo,
    onlyApproved: opts.onlyApproved,
    delayMs: opts.delayMs,
  });

  console.log(
    JSON.stringify(
      {
        ...result,
        recipients: result.recipients.map((r) => ({
          email: r.email,
          studio: r.studioName,
          status: r.verificationStatus,
        })),
      },
      null,
      2,
    ),
  );

  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
