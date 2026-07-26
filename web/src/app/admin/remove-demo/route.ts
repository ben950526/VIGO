import { redirect } from "next/navigation";
import { removeAllDemoAccounts } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET() {
  await requireAdmin();
  const result = await removeAllDemoAccounts();
  const query = result.ok
    ? "demoRemoved=1"
    : `demoRemoveError=${encodeURIComponent(result.message)}`;
  redirect(`/admin/review?${query}`);
}
