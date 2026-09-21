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
  console.warn("No .env.local");
}

async function main() {
  console.log(
    JSON.stringify({
      hasAdminEmail: Boolean(process.env.ADMIN_EMAIL?.trim()),
      hasResend: Boolean(process.env.RESEND_API_KEY?.trim()),
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    }),
  );

  const { runDailyAdminReviewDigest } = await import(
    "../src/lib/review-queue/runDailyAdminDigest"
  );
  const result = await runDailyAdminReviewDigest();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
