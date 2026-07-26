export interface DemoStudioPatch {
  slug: string;
  studio_name: string;
  bio: string;
  region: string;
  service_types: string[];
  style_tags: string[];
  contact_email: string;
  line_id: string;
  phone: string;
  team_size: string;
  turnaround: string;
  revision_policy: string;
  response_time: string;
  platforms: string[];
  client_types: string[];
  languages: string[];
  typical_scope: string;
  price_list: { label: string; price: number; note?: string }[];
}

export const demoStudioPatches: DemoStudioPatch[] = [
  {
    slug: "reel-lab-demo",
    studio_name: "Reel Lab 短影工作室（示範）",
    bio: "【示範帳號】專做電商 Reels 與開箱快剪，此頁僅供瀏覽平台樣式。",
    region: "台北市",
    service_types: ["剪輯", "動態字幕"],
    style_tags: ["電商開箱", "Reels直式", "動態字幕"],
    contact_email: "demo-reel-lab@vigo.local",
    line_id: "@reel-lab-demo",
    phone: "0900000001",
    team_size: "1–2 人小組",
    turnaround: "7–14 工作天",
    revision_policy: "含 2 次修改",
    response_time: "12 小時內",
    platforms: ["Instagram", "TikTok"],
    client_types: ["電商品牌", "新創"],
    languages: ["中文"],
    typical_scope: "15–60 秒 Reels",
    price_list: [
      { label: "單支 Reels 剪輯", price: 8000, note: "含字幕與 BGM" },
      { label: "3 支套餐", price: 20000 },
    ],
  },
  {
    slug: "knowflow-demo",
    studio_name: "KnowFlow 知識影音（示範）",
    bio: "【示範帳號】知識型口播與課程短影音，非真實接案者。",
    region: "新北市",
    service_types: ["剪輯", "腳本"],
    style_tags: ["知識型", "口播"],
    contact_email: "demo-knowflow@vigo.local",
    line_id: "@knowflow-demo",
    phone: "0900000002",
    team_size: "個人創作者",
    turnaround: "10 工作天",
    revision_policy: "含 2 次修改",
    response_time: "24 小時以上",
    platforms: ["YouTube", "LinkedIn"],
    client_types: ["顧問", "線上課程"],
    languages: ["中文", "英文"],
    typical_scope: "知識型 60–90 秒",
    price_list: [
      { label: "口播精華剪輯", price: 6000 },
      { label: "課程預告片", price: 15000 },
    ],
  },
  {
    slug: "vibecut-demo",
    studio_name: "Vibe Cut 趣味剪輯（示範）",
    bio: "【示範帳號】趣味 Vlog、迷因風格剪輯示範，請勿聯絡委託。",
    region: "台中市",
    service_types: ["剪輯"],
    style_tags: ["搞笑", "Vlog", "抖音風"],
    contact_email: "demo-vibecut@vigo.local",
    line_id: "@vibecut-demo",
    phone: "0900000003",
    team_size: "個人創作者",
    turnaround: "5–7 工作天",
    revision_policy: "含 1 次修改",
    response_time: "12 小時內",
    platforms: ["TikTok", "Instagram"],
    client_types: ["餐飲", "個人 IP"],
    languages: ["中文"],
    typical_scope: "趣味短影音",
    price_list: [{ label: "趣味短剪", price: 4000 }],
  },
  {
    slug: "frame-studio-demo",
    studio_name: "Frame Studio 質感影像（示範）",
    bio: "【示範帳號】質感廣告與產品展示示範頁，非實際接案工作室。",
    region: "台北市",
    service_types: ["拍攝", "一條龍"],
    style_tags: ["質感廣告", "一鏡到底"],
    contact_email: "demo-frame@vigo.local",
    line_id: "@frame-studio-demo",
    phone: "0900000004",
    team_size: "3–5 人團隊",
    turnaround: "14–21 工作天",
    revision_policy: "可討論",
    response_time: "24 小時以上",
    platforms: ["YouTube", "Instagram"],
    client_types: ["精品", "3C"],
    languages: ["中文"],
    typical_scope: "品牌廣告短片",
    price_list: [
      { label: "質感產品片", price: 25000 },
      { label: "一條龍專案", price: 45000 },
    ],
  },
  {
    slug: "shorts-pro-demo",
    studio_name: "Shorts Pro 一條龍（示範）",
    bio: "【示範帳號】電商開箱一條龍流程示範，請勿匯款或委託。",
    region: "高雄市",
    service_types: ["一條龍", "剪輯"],
    style_tags: ["電商開箱", "動態字幕", "Reels直式"],
    contact_email: "demo-shortspro@vigo.local",
    line_id: "@shortspro-demo",
    phone: "0900000005",
    team_size: "2–4 人小組",
    turnaround: "10 工作天",
    revision_policy: "含 2 次修改",
    response_time: "12 小時內",
    platforms: ["Instagram", "TikTok", "YouTube"],
    client_types: ["電商", "品牌"],
    languages: ["中文"],
    typical_scope: "開箱到上架",
    price_list: [{ label: "開箱一條龍", price: 18000 }],
  },
  {
    slug: "motion-lab-demo",
    studio_name: "Motion Lab 動態字幕（示範）",
    bio: "【示範帳號】動態字幕與知識型影片示範，非真實創作者。",
    region: "桃園市",
    service_types: ["剪輯", "動態字幕"],
    style_tags: ["動態字幕", "知識型", "口播"],
    contact_email: "demo-motionlab@vigo.local",
    line_id: "@motionlab-demo",
    phone: "0900000006",
    team_size: "個人創作者",
    turnaround: "7 工作天",
    revision_policy: "含 2 次修改",
    response_time: "12 小時內",
    platforms: ["YouTube"],
    client_types: ["顧問", "教育"],
    languages: ["中文"],
    typical_scope: "字幕強化口播",
    price_list: [
      { label: "動態字幕剪輯", price: 5000 },
      { label: "長片精華版", price: 12000 },
    ],
  },
];

export function demoPatchToDbRow(patch: DemoStudioPatch) {
  return {
    studio_name: patch.studio_name,
    bio: patch.bio,
    region: patch.region,
    service_types: patch.service_types,
    style_tags: patch.style_tags,
    price_min: null,
    price_max: null,
    contact_email: patch.contact_email,
    line_id: patch.line_id,
    phone: patch.phone,
    show_email: false,
    show_line: false,
    show_phone: false,
    team_size: patch.team_size,
    turnaround: patch.turnaround,
    revision_policy: patch.revision_policy,
    response_time: patch.response_time,
    platforms: patch.platforms,
    client_types: patch.client_types,
    languages: patch.languages,
    typical_scope: patch.typical_scope,
    price_list: patch.price_list,
    verification_status: "approved" as const,
    is_listed: true,
    is_demo: true,
    featured: patch.slug === "reel-lab-demo" || patch.slug === "frame-studio-demo",
  };
}
