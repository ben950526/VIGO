import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/forms/GoogleSignInButton";
import { safeNextPath } from "@/lib/auth/clientGate";
import { getAuthUserId } from "@/lib/auth/session";

export const metadata = {
  title: "登入逛作品",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  // 已登入就直接回去要看的頁面
  if (await getAuthUserId()) redirect(next);

  return (
    <section className="section">
      <div className="container-narrow mx-auto max-w-md">
        <h1 className="mb-3 text-center text-3xl font-bold">登入後逛短影音工作室</h1>
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          用 Google 帳號一鍵登入就能看所有工作室的作品。發案者完全免費，Vigo 不抽成、不介入你們的合作。
        </p>

        {params.error === "auth" && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            登入沒有完成，請再試一次。
          </p>
        )}

        <GoogleSignInButton as="client" next={next} />

        <ul className="mt-8 space-y-2 text-sm text-[var(--text-secondary)]">
          <li>・先看作品，對到風格再按「敲門」拿聯絡方式</li>
          <li>・直接聯絡工作室，不經過我們</li>
          <li>・登入後幾天內會寄最多 3 封找工作室的小提醒，信裡可以一鍵取消</li>
        </ul>

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          繼續即表示你同意 Vigo 的
          <Link href="/terms" className="mx-1 underline">
            服務條款
          </Link>
          與
          <Link href="/privacy" className="mx-1 underline">
            隱私權政策
          </Link>
          ，並同意我們寄送上述提醒信。
        </p>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          你是剪輯師或工作室？
          <Link href="/login" className="ml-1 text-[var(--accent)] hover:underline">
            接案者登入
          </Link>
          <span className="mx-1">／</span>
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            免費註冊
          </Link>
        </p>
      </div>
    </section>
  );
}
