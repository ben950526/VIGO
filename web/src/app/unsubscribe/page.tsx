import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata = { title: "取消提醒信" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function unsubscribe(formData: FormData) {
  "use server";
  const token = String(formData.get("t") ?? "");
  if (!UUID.test(token)) return;
  const service = createServiceClient();
  if (!service) return;
  await service.from("profiles").update({ email_opt_out: true }).eq("unsubscribe_token", token);
  redirect("/unsubscribe?done=1");
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; done?: string }>;
}) {
  const { t, done } = await searchParams;

  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-md text-center">
        {done === "1" ? (
          <>
            <h1 className="mb-3 text-2xl font-bold">已取消</h1>
            <p className="text-[var(--text-secondary)]">之後不會再寄找工作室的提醒信給你。</p>
          </>
        ) : t && UUID.test(t) ? (
          <>
            <h1 className="mb-3 text-2xl font-bold">不想再收到提醒信？</h1>
            <p className="mb-6 text-[var(--text-secondary)]">按下面的按鈕，就不會再寄找工作室的提醒信給你。</p>
            {/* 用按鈕確認，避免信箱的連結掃描器自動點開就幫人取消 */}
            <form action={unsubscribe}>
              <input type="hidden" name="t" value={t} />
              <button type="submit" className="btn-primary">
                確認取消
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="mb-3 text-2xl font-bold">連結無效</h1>
            <p className="text-[var(--text-secondary)]">請從信裡的「一鍵取消」連結重新進來。</p>
          </>
        )}
      </div>
    </section>
  );
}
