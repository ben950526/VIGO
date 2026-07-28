"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}

export function SubmitButton({
  children,
  className,
  pendingText = "處理中…",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={cn(className, pending && "opacity-70")}>
      {pending ? pendingText : children}
    </button>
  );
}
