"use client";

import { useActionState } from "react";
import { resendCreatorApprovalEmail, type ResendApprovalState } from "@/actions/admin";
import { SubmitButton } from "@/components/forms/SubmitButton";

const initial: ResendApprovalState = {};

export function AdminResendApprovalForm({ creatorId }: { creatorId: string }) {
  const [state, formAction] = useActionState(resendCreatorApprovalEmail, initial);

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="id" value={creatorId} />
      <SubmitButton className="text-sm text-[var(--accent)] hover:underline" pendingText="寄送中…">
        補寄通過信
      </SubmitButton>
      {state.ok ? <p className="mt-1 text-xs text-green-700">{state.message}</p> : null}
      {state.error ? <p className="mt-1 text-xs text-red-700">{state.error}</p> : null}
    </form>
  );
}
