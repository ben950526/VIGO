const VISITOR_KEY = "vigo_visitor_key";

export function getVisitorKey(): string {
  if (typeof window === "undefined") return "";

  let key = localStorage.getItem(VISITOR_KEY);
  if (!key) {
    key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, key);
  }
  return key;
}

export function knockStorageKey(creatorId: string): string {
  return `vigo_knock_unlock_${creatorId}`;
}

export function isKnockUnlocked(creatorId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(knockStorageKey(creatorId)) === "1";
}

export function setKnockUnlocked(creatorId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(knockStorageKey(creatorId), "1");
}
