"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * 讀只有瀏覽器才有的值（sessionStorage、localStorage…）。
 * 伺服器端與 hydration 時回傳 serverValue，之後換成瀏覽器的值，不會造成 hydration 不一致。
 * read 必須回傳原始型別（字串、布林），否則每次 render 都會被當成新值。
 */
export function useClientValue<T extends string | number | boolean | null>(
  read: () => T,
  serverValue: T,
): T {
  return useSyncExternalStore(noopSubscribe, read, () => serverValue);
}
