import { cookies } from "next/headers";

const COOKIE_NAME = "vigo_unlocked_creators";
const MAX_AGE = 60 * 60 * 24 * 365;

function parseUnlockedIds(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export async function isCreatorKnockUnlocked(creatorId: string): Promise<boolean> {
  const store = await cookies();
  return parseUnlockedIds(store.get(COOKIE_NAME)?.value).includes(creatorId);
}

export async function setCreatorKnockUnlocked(creatorId: string): Promise<void> {
  const store = await cookies();
  const ids = parseUnlockedIds(store.get(COOKIE_NAME)?.value);
  if (ids.includes(creatorId)) return;

  store.set(COOKIE_NAME, JSON.stringify([...ids, creatorId]), {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
