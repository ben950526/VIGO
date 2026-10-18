export type LiveBrief = {
  id: string;
  title: string;
  detail: string;
};

/** 公開的發案需求列表（勿放真實案主姓名／可識別個案；僅供營運必要時使用，預設不展示） */
export const LIVE_BRIEFS: readonly LiveBrief[] = [];

export const LIVE_BRIEFS_CLIENT_HINT =
  "先逛作品、對到風格再按敲門。平台不抽成、不介入交易。";

export const LIVE_BRIEFS_CREATOR_HINT =
  "介紹至少約 20 字、再有 1 支已通過的 YouTube 或 Reels，就會出現在探索頁。";

export function getLiveBriefsBannerTitle(audience: "client" | "creator"): string {
  return audience === "client" ? "發案小提示" : "接案小提示";
}
