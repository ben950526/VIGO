import { DEMO_WARNING } from "@/lib/demo-creator";

export function DemoAccountBanner() {
  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-4 text-center text-sm text-amber-950 md:px-6 md:text-base"
    >
      <p className="font-semibold">⚠️ 示範帳號 — 請勿委託</p>
      <p className="mt-1 max-w-2xl mx-auto">{DEMO_WARNING}</p>
    </div>
  );
}
