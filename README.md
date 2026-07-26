# Vigo

繁中短影音接案媒合平台 — 發案者逛店式選人，接案者被動曝光作品集。

## 專案結構

```
vigo/
├── reference/          # UI 參考
└── web/                # Next.js 應用（主要開發目錄）
```

## 重要：需要 Supabase

**本專案必須連接 Supabase 才能正常運作。**

未設定 Supabase 時：
- 首頁 / 探索頁**不會有創作者**
- 無法註冊、登入
- 後台審核無法使用

示範創作者需由管理員在後台按「建立示範帳號」建立（需先跑完資料庫 migration）。

詳細設定請看：**[web/README.md](web/README.md)**

## 快速開始（本機）

```bash
cd web
npm install
cp .env.example .env.local   # 填入 Supabase 憑證（見 web/README.md）
npm run dev
```

開啟 http://localhost:3000

## 技術棧

- Next.js 16 + TypeScript + Tailwind CSS v4
- Supabase（Auth + PostgreSQL + Storage）
- 作品以 YouTube / Vimeo / Instagram **embed 連結**呈現（不上傳影片）

## 主要功能

| 對象 | 功能 |
|------|------|
| 發案者 | 首頁、探索（篩選）、創作者公開頁、站外聯絡 |
| 接案者 | 註冊、編輯工作室、價目表、作品、自行上架/下架 |
| 管理員 | 審核、意見回饋、BUG 回報、示範帳號管理 |

## 路線圖

- [x] W1–2：首頁、探索、創作者公開頁、接案者後台
- [x] W5：管理後台審核、意見/BUG、示範帳號
- [ ] W6+：評價、訂閱（綠界）

## 部署

正式上線：**Vercel（前端）+ Supabase（資料庫）**。  
步驟見 [web/README.md](web/README.md) 的「部署到 Vercel」章節（後續會補上）。

## 費用（MVP 階段）

| 項目 | 費用 |
|------|------|
| Supabase | 免費層（使用者變多可升 Pro） |
| Vercel | 免費層（正式營運建議 Pro） |
| 網域 | 約 NT$300–800/年（自行購買） |
