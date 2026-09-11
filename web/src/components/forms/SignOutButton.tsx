"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  className?: string;
  children: React.ReactNode;
};

export function SignOutButton({ className, children }: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={pending} className={className}>
      {pending ? "登出中…" : children}
    </button>
  );
}
