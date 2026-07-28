"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  disabled?: boolean;
}

export function SubmitButton({
  children,
  className,
  pendingText = "處理中…",
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(className, (pending || disabled) && "opacity-70")}
    >
      {pending ? pendingText : children}
    </button>
  );
}
