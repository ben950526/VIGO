"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { siteUrl } from "@/lib/email/config";
import { STARTER_THREADS_POSTS, starterFirstReply } from "@/lib/threads/starter-posts";
import {
  bulkSetThreadsStatus,
  connectThreadsWithToken,
  createThreadsPost,
  deleteThreadsPost,
  disconnectThreads,
  importStarterPosts,
  markStuckPostFailed,
  publishNextApprovedPost,
  updateThreadsPost,
} from "@/lib/threads/store";

const PAGE = "/admin/threads";

function back(message: string, kind: "ok" | "error" = "ok"): never {
  revalidatePath(PAGE);
  redirect(`${PAGE}?${kind}=${encodeURIComponent(message)}`);
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readPostFields(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  const firstReply = String(formData.get("first_reply") ?? "").trim();
  const style = String(formData.get("style") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  return {
    body,
    first_reply: firstReply || null,
    style: style || null,
    sort_order: Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0,
  };
}

function validate(fields: { body: string; first_reply: string | null }): string | null {
  if (!fields.body) return "主文不能是空的";
  if ([...fields.body].length > 500) return "主文超過 500 字（Threads 上限）";
  if (fields.first_reply && [...fields.first_reply].length > 500) return "留言超過 500 字";
  return null;
}

export async function connectThreadsAction(formData: FormData) {
  await requireAdmin();
  let username = "";
  try {
    ({ username } = await connectThreadsWithToken(String(formData.get("token") ?? "")));
  } catch (error) {
    back(`連結失敗：${errorText(error)}`, "error");
  }
  back(`已連結 Threads 帳號 @${username}`);
}

export async function disconnectThreadsAction() {
  await requireAdmin();
  try {
    await disconnectThreads();
  } catch (error) {
    back(errorText(error), "error");
  }
  back("已解除連結，之後 Cron 不會再發文");
}

export async function createThreadsPostAction(formData: FormData) {
  await requireAdmin();
  const fields = readPostFields(formData);
  const invalid = validate(fields);
  if (invalid) back(invalid, "error");
  try {
    await createThreadsPost(fields);
  } catch (error) {
    back(errorText(error), "error");
  }
  back("已新增為草稿，核准後才會排進發文");
}

export async function saveThreadsPostAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "save");
  const fields = readPostFields(formData);
  const invalid = validate(fields);
  if (invalid) back(invalid, "error");

  const status =
    intent === "approve" ? "approved" : intent === "unapprove" ? "draft" : undefined;
  try {
    await updateThreadsPost(id, { ...fields, ...(status ? { status } : {}) });
  } catch (error) {
    back(errorText(error), "error");
  }
  back(
    intent === "approve"
      ? "已核准，會依順序自動發出"
      : intent === "unapprove"
        ? "已改回草稿，不會發出"
        : "已儲存",
  );
}

export async function deleteThreadsPostAction(formData: FormData) {
  await requireAdmin();
  try {
    await deleteThreadsPost(String(formData.get("id") ?? ""));
  } catch (error) {
    back(errorText(error), "error");
  }
  back("已刪除");
}

export async function markStuckFailedAction(formData: FormData) {
  await requireAdmin();
  try {
    await markStuckPostFailed(String(formData.get("id") ?? ""));
  } catch (error) {
    back(errorText(error), "error");
  }
  back("已標為失敗；請先到 Threads 確認沒有發出，再決定要不要重新核准");
}

export async function importStarterPostsAction() {
  await requireAdmin();
  let count = 0;
  try {
    count = await importStarterPosts(STARTER_THREADS_POSTS, starterFirstReply(siteUrl()));
  } catch (error) {
    back(errorText(error), "error");
  }
  back(count > 0 ? `已匯入 ${count} 篇草稿，請逐篇看過再核准` : "預設文案都已匯入過了");
}

export async function approveAllDraftsAction() {
  await requireAdmin();
  let count = 0;
  try {
    count = await bulkSetThreadsStatus("draft", "approved");
  } catch (error) {
    back(errorText(error), "error");
  }
  back(count > 0 ? `已核准 ${count} 篇，會依順序每天中午、晚上各發一篇` : "沒有草稿可以核准");
}

export async function pauseAllApprovedAction() {
  await requireAdmin();
  let count = 0;
  try {
    count = await bulkSetThreadsStatus("approved", "draft");
  } catch (error) {
    back(errorText(error), "error");
  }
  back(count > 0 ? `已暫停：${count} 篇改回草稿，不會再自動發` : "目前沒有排隊中的文案");
}

/** 管理員手動「現在發下一篇」：會真的公開發文 */
export async function publishNowAction() {
  await requireAdmin();
  const result = await publishNextApprovedPost();
  if (!result.ok) back(`發文失敗：${result.error}`, "error");
  if (!result.posted) back(result.reason, "error");
  back(result.replyError ?? "已發出一篇");
}
