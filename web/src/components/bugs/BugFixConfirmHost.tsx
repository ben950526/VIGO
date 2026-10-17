import { getPendingBugConfirms } from "@/lib/data/bug-confirms";
import { BugFixConfirmBanner } from "@/components/bugs/BugFixConfirmBanner";

export async function BugFixConfirmHost() {
  const items = await getPendingBugConfirms();
  if (items.length === 0) return null;
  return <BugFixConfirmBanner items={items} />;
}
