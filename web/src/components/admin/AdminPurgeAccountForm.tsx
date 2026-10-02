"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { purgeCreatorAccount, type PurgeCreatorState } from "@/actions/admin";
import { SubmitButton } from "@/components/forms/SubmitButton";

const initial: PurgeCreatorState = {};

type Props = {
  creatorId: string;
  slug: string;
  studioName: string;
  onPurged?: () => void;
};

export function AdminPurgeAccountForm({ creatorId, slug, studioName, onPurged }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (prev: PurgeCreatorState | null, formData: FormData) => {
      const result = await purgeCreatorAccount(prev, formData);
      if (result.ok) {
        onPurged?.();
        router.refresh();
      }
      return result;
    },
    initial,
  );

  if (state.ok) {
    return <p className="text-sm text-green-700">{state.message ?? "已註銷"}</p>;
  }

  return (
    <form action={formAction} className="mt-4 space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
      <input type="hidden" name="id" value={creatorId} />
      <p className="text-sm font-medium text-red-800">完整註銷帳號（無法復原）</p>
      <p className="text-xs leading-relaxed text-red-800/90">
        會刪除「{studioName}」的登入帳號、工作室、作品、敲門紀錄與該帳號的邀請／點數資料。刪除後同一 Email 可再註冊。
        請輸入 slug <strong className="font-mono">{slug}</strong> 確認。
      </p>
      <input
        className="input w-full bg-white text-sm"
        name="confirm_slug"
        autoComplete="off"
        placeholder={`輸入 ${slug} 確認`}
      />
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <SubmitButton
        className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-100"
        pendingText="註銷中…"
      >
        註銷工作室與帳號
      </SubmitButton>
    </form>
  );
}
