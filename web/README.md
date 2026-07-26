# Vigo Web

Next.js 應用 — 繁中短影音接案媒合平台。

## 必要條件

- Node.js 20+
- [Supabase](https://supabase.com) 專案（免費方案即可）

**沒有 Supabase = 網站無創作者、無法登入。** 沒有「離線示範模式」。

---

## 1. 安裝與環境變數

```bash
npm install
cp .env.example .env.local
```

編輯 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的專案.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=你的管理員信箱@gmail.com
```

| 變數 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公開 anon key（Settings → API） |
| `NEXT_PUBLIC_SITE_URL` | 本機用 `http://localhost:3000`；上線改正式網域 |
| `ADMIN_EMAIL` | 此信箱登入後可進 `/admin/review` |

> 在 Supabase Dashboard → **Settings → API** 可找到 URL 與 anon key。

---

## 2. 資料庫（必做）

**完整圖文教學：** [`supabase/SETUP.md`](supabase/SETUP.md)

全新 Supabase 專案請依序跑 **5 個 SQL 檔**：

1. `migrations/001_initial_schema.sql`
2. `migrations/002_admin_rls.sql`
3. `migrations/003_avatar_storage.sql`
4. `RUN_ONCE.sql`
5. `migrations/013_is_demo.sql`

每個檔案：本機複製全文 → Supabase SQL Editor 貼上 → Run → 看到 Success 再下一個。

---

## 3. 啟動

```bash
npm run dev
```

開啟 http://localhost:3000

---

## 4. 管理員第一次使用

1. 用 `ADMIN_EMAIL` 的信箱 **註冊** 一個帳號（`/register`）
2. 登入後開 http://localhost:3000/admin/review
3. 審核通過創作者，或按 **建立示範帳號**（需已執行 `013_is_demo.sql`）

---

## 5. 常用路徑

| 路徑 | 說明 |
|------|------|
| `/` | 首頁 |
| `/explore` | 探索創作者 |
| `/register` | 接案者註冊 |
| `/dashboard` | 我的工作室 |
| `/admin/review` | 審核管理 |
| `/admin/feedback` | 使用者意見 |
| `/admin/bugs` | BUG 回報 |
| `/feedback` | 公開意見回饋 |
| `/report-bug` | 公開 BUG 回報 |

---

## 指令

```bash
npm run dev      # 開發
npm run build    # 正式建置（部署前建議跑一次）
npm run start    # 正式模式本機預覽
npm run lint     # ESLint
```

---

## 部署到 Vercel

**完整圖文教學：** [`DEPLOY.md`](DEPLOY.md)

摘要：
1. GitHub 推程式 → Vercel Import（**Root Directory = `web`**）
2. 設 4 個環境變數 → Deploy
3. Supabase Auth 加正式 `/auth/callback` URL

---

## 技術說明

- Next.js 16 App Router + Server Actions
- Supabase Auth（email/password）
- 作品不上傳影片，只 embed 外部連結
- 發案者與接案者**站外聯絡**（Email / LINE ID / 電話），無站內詢價表單
