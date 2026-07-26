import { redirect } from "next/navigation";
import { seedAllDemoData } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET() {
  await requireAdmin();
  const result = await seedAllDemoData();
  const query = result.ok ? "demoSeeded=1" : `demoSeedError=${encodeURIComponent(result.message)}`;
  redirect(`/admin/review?${query}`);
}
