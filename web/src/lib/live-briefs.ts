/** 目前進行中的發案（公開文案；過期就改這份） */
export const LIVE_BRIEFS = [
  {
    id: "handcraft",
    client: "朱小姐",
    title: "主題式手作／工藝品行銷",
    detail: "一個月大約 20 支，希望長期配合",
  },
  {
    id: "mahjong",
    client: "黃先生",
    title: "麻將系列",
    detail: "上一波還缺一位，一個月大約 25 支",
  },
  {
    id: "travel",
    client: "顏小姐",
    title: "旅遊短影片",
    detail: "短期幾支，專案單價不錯",
  },
] as const;

export const LIVE_BRIEFS_HEADLINE = "現在有發案者在找剪輯，人都還沒選定";

export const LIVE_BRIEFS_CLIENT_HINT =
  "先逛作品、對到風格再按敲門。平台不抽成、不介入交易。";

export const LIVE_BRIEFS_CREATOR_HINT =
  "介紹至少約 20 字、再有 1 支已通過的 YouTube 或 Reels，就會出現在探索頁。";