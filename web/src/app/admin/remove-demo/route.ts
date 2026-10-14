import { redirect } from "next/navigation";
import { removeAllDemoAccounts } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth/admin";

/** GET 會被 Link 預抓，不能在這裡撤除 */
export async function GET() {
  await requireAdmin();
  redirect("/admin/review");
}

export async function POST() {
  await requireAdmin();
  const result = await removeAllDemoAccounts();
  const query = result.ok
    ? "demoRemoved=1"
    : `demoRemoveError=${encodeURIComponent(result.message)}`;
  redirect(`/admin/review?${query}`);
}
