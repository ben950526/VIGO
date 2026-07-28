"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SubmitButton } from "@/components/forms/SubmitButton";

type ServerAction = (formData: FormData) => Promise<void>;

interface AdminActionFormProps {
  action: ServerAction;
  id: string;
  className?: string;
  pendingText?: string;
  children: React.ReactNode;
  removeOnSuccess?: boolean;
  onDone?: () => void;
}

export function AdminActionForm({
  action,
  id,
  className,
  pendingText,
  children,
  removeOnSuccess = true,
  onDone,
}: AdminActionFormProps) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [, startTransition] = useTransition();

  if (removed && removeOnSuccess) return null;

  async function handleSubmit(formData: FormData) {
    onDone?.();
    if (removeOnSuccess) setRemoved(true);
    startTransition(async () => {
      try {
        await action(formData);
        router.refresh();
      } catch {
        if (removeOnSuccess) setRemoved(false);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton className={className} pendingText={pendingText}>
        {children}
      </SubmitButton>
    </form>
  );
}

interface AdminToggleFormProps {
  action: ServerAction;
  id: string;
  listed: boolean;
  className?: string;
  pendingText?: string;
  children: React.ReactNode;
}

export function AdminToggleForm({
  action,
  id,
  listed,
  className,
  pendingText,
  children,
}: AdminToggleFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="listed" value={listed ? "false" : "true"} />
      <SubmitButton className={className} pendingText={pendingText}>
        {children}
      </SubmitButton>
    </form>
  );
}
