"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { refreshThreadsInsights } from "@/lib/threads/insights";
import { isThreadsProject, THREADS_STYLES } from "@/lib/threads/projects";
import { buildStarterImportRows } from "@/lib/threads/starter-posts";
import {
  bulkImportThreadsPosts,
  type BulkImportItem,
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
  const project = String(formData.get("project") ?? "");
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  return {
    body,
    first_reply: firstReply || null,
    style: style || null,
    project: isThreadsProject(project) ? project : ("vigo" as const),
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
    count = await importStarterPosts(buildStarterImportRows());
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
  back(count > 0 ? `已核准 ${count} 篇，會依順序在每天中午、晚上發出` : "沒有草稿可以核准");
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

/**
 * 批次匯入：貼上 JSON 陣列，每筆 { body, project, style, sort_order }，全部匯入成草稿。
 * 任何一筆格式不對就整批不匯入；body 和現有文案重複的跳過。
 */
export async function bulkImportThreadsPostsAction(formData: FormData) {
  await requireAdmin();
  const raw = String(formData.get("json") ?? "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    back("JSON 格式錯誤，請確認是一個陣列，例如 [{\"body\": \"…\", \"project\": \"med\"}]", "error");
  }
  if (!Array.isArray(parsed) || parsed.length === 0) back("要貼上一個非空的 JSON 陣列", "error");
  if ((parsed as unknown[]).length > 100) back("一次最多匯入 100 篇", "error");

  const items: BulkImportItem[] = [];
  const problems: string[] = [];
  (parsed as unknown[]).forEach((entry, index) => {
    const n = index + 1;
    const item = (entry ?? {}) as Record<string, unknown>;
    const body = typeof item.body === "string" ? item.body.trim() : "";
    const style = typeof item.style === "string" ? item.style.trim() : "";
    const sortOrder = item.sort_order === undefined ? 0 : Number(item.sort_order);
    if (!body) problems.push(`第 ${n} 筆沒有 body`);
    else if ([...body].length > 500) problems.push(`第 ${n} 筆超過 500 字`);
    if (!isThreadsProject(item.project)) problems.push(`第 ${n} 筆 project 要是 vigo／med／storybook／logicgym`);
    if (style && !(THREADS_STYLES as readonly string[]).includes(style)) {
      problems.push(`第 ${n} 筆 style 不在清單內（${THREADS_STYLES.join("、")}）`);
    }
    if (!Number.isFinite(sortOrder)) problems.push(`第 ${n} 筆 sort_order 不是數字`);
    if (body && isThreadsProject(item.project)) {
      items.push({ body, project: item.project, style: style || null, sort_order: Math.round(sortOrder) || 0 });
    }
  });
  if (problems.length > 0) back(`沒有匯入：${problems.slice(0, 5).join("；")}`, "error");

  let result = { imported: 0, skipped: 0 };
  try {
    result = await bulkImportThreadsPosts(items);
  } catch (error) {
    back(errorText(error), "error");
  }
  back(`已匯入 ${result.imported} 篇草稿${result.skipped ? `，${result.skipped} 篇內容重複已跳過` : ""}，核准後才會發`);
}

/** 管理員手動更新成效（也用來確認權杖有沒有 threads_manage_insights 權限） */
export async function refreshInsightsAction() {
  await requireAdmin();
  const result = await refreshThreadsInsights();
  if (!result.ok) back(`成效更新有問題：${result.error ?? "未知錯誤"}（成功 ${result.postsUpdated} 篇）`, "error");
  back(`已更新 ${result.postsUpdated} 篇貼文的成效與帳號數據`);
}
