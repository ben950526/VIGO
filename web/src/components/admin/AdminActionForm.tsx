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
  skipRefresh?: boolean;
}

export function AdminActionForm({
  action,
  id,
  className,
  pendingText,
  children,
  removeOnSuccess = true,
  onDone,
  skipRefresh = false,
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
        if (!skipRefresh) router.refresh();
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
  slug?: string;
  listed: boolean;
  className?: string;
  pendingText?: string;
  labelWhenListed: string;
  labelWhenUnlisted: string;
}

export function AdminToggleForm({
  action,
  id,
  slug,
  listed,
  className,
  pendingText,
  labelWhenListed,
  labelWhenUnlisted,
}: AdminToggleFormProps) {
  const router = useRouter();
  const [isListed, setIsListed] = useState(listed);
  const [, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const prev = isListed;
    setIsListed(!isListed);
    startTransition(async () => {
      try {
        await action(formData);
      } catch {
        setIsListed(prev);
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      {slug && <input type="hidden" name="slug" value={slug} />}
      <input type="hidden" name="listed" value={isListed ? "false" : "true"} />
      <SubmitButton className={className} pendingText={pendingText}>
        {isListed ? labelWhenListed : labelWhenUnlisted}
      </SubmitButton>
    </form>
  );
}
