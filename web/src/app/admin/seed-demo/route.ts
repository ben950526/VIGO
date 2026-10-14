import { redirect } from "next/navigation";
import { seedAllDemoData } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth/admin";

/** GET 會被 Link 預抓，不能在這裡種示範帳 */
export async function GET() {
  await requireAdmin();
  redirect("/admin/review");
}

export async function POST() {
  await requireAdmin();
  const result = await seedAllDemoData();
  const query = result.ok ? "demoSeeded=1" : `demoSeedError=${encodeURIComponent(result.message)}`;
  redirect(`/admin/review?${query}`);
}
