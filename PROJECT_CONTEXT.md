# Vigo 專案交接（給下一個 AI 助手）

> 撰寫日期：2026-10-29。以當時倉庫程式、設定檔，以及 Cursor 對話紀錄為準。  
> **不要猜。** 本文件已標「待確認」的項目，接手後先向經營者核對或查線上環境，不要當事實寫進新功能。  
> 與使用者溝通一律使用**繁體中文（台灣）**。程式識別符與 API 名稱可維持英文。

正式站：https://vigo-woad.vercel.app  
GitHub：https://github.com/ben950526/VIGO（`main`，Vercel Root Directory = `web`）

---

## 0. 2026-10-29 線上查核結果（Claude Code 接手後實查）

以唯讀方式查正式環境（GitHub 部署狀態、Supabase anon REST、公開 DNS）。下列結果取代文件其他段落的同名「待確認」。

| 項目 | 結果 | 下一步 |
|------|------|--------|
| Vercel 部署 | `e058190` 部署成功。前兩次 `a56e780`、`eaf56a4` **建置失敗**（`page-views.ts` 型別錯誤），所以「管理員瀏覽不計入」到 10/29 才真正上線。 | 無 |
| `032_studio_page_views_from_admin.sql` | 原本沒跑；**10/29 經營者已執行，複查確認 `from_admin` 欄位存在**。 | 用管理員登入開別人的公開頁，確認本週瀏覽不增加 |
| `020_promo_rules_and_social_share.sql` | 原本沒跑；**10/29 經營者已執行，複查確認 `promo_share_submissions` 與審核函式存在**，上限 300 生效。 | 無 |
| `019_referral_cap_500.sql` | 無法用 anon 權限判斷。目前所有人折抵點皆為 0，無實際影響；020 跑完後上限以 300 為準。 | 跑完 020 即可 |
| `017_invite_code.sql` | 原本沒跑；**10/29 經營者已執行，複查確認 `invite_code` 欄位存在**。 | 無 |
| 其他 | 016、024、025／031、026、027、029、030 確認已在線上。`023` 的 `onboarding_day3_sent_at` 不存在（已由 024 的 1／3／7 天欄位取代，程式不需要）。 | 無 |
| 「謙卑群發致歉＋推薦碼換點數」 | 查不到：本機 Resend key 是**僅寄信**權限，無法讀寄送紀錄。倉庫內沒有這封信的腳本或 commit，推測未寄。 | 經營者到 Resend 後台 Emails 確認 |
| try-vigo.com 綁網站 | **沒綁**：根網域無 A／CNAME 紀錄、`www` 不存在。只有 `mail.try-vigo.com`（Resend 寄件）設定正常。正式站仍是 `vigo-woad.vercel.app`。 | 可選，見 `web/DEPLOY.md` |
| Cursor Automation | 設定在 Cursor 雲端，本機查不到。 | 經營者到 Cursor Automations 關掉（每日報告已由 Vercel Cron 負責） |

017、020、032 已於 10/29 依序執行完成。本機 `.env.local` 沒有 `SUPABASE_SERVICE_ROLE_KEY`。

---

## 1. 專案概述

### 這個網站是做什麼的

**Vigo** 是繁中**短影音接案媒合**平台。發案者像逛店一樣看工作室與作品；接案者上架作品集被動曝光。平台**不代收代付、不介入交易**，聯絡發生在站外（Email／LINE／電話）。

產品流程（現行）：

1. 發案者逛 `/explore` → 進 `/creator/[slug]` 看作品。
2. 聯絡方式預設鎖定；按「敲門」後才解鎖（並要求第一則私訊表明來自 Vigo）。
3. 接案者註冊、填工作室、貼 YouTube／Vimeo／Instagram **embed 連結**（不上傳影片檔）。
4. 管理員審核工作室與作品；通過且資料齊全才出現在探索頁。

### 目標使用者

| 角色 | 要不要註冊 | 要做什麼 |
|------|------------|----------|
| 發案者 | 不用 | 逛探索頁、看作品、敲門拿聯絡方式 |
| 接案者 | 要 | 免費上架、被動曝光、用邀請碼拉人 |
| 管理員 | 要（`ADMIN_EMAIL`） | 審核、群發、看本週敲門／瀏覽 |

發案者是稀缺資源，**不對發案者收費**。變現計畫是接案者 Pro（NT$199／月），**尚未開發金流**。

### 目前完成度（2026-10-29）

**已上線（程式有、正式站在跑）**

- 首頁、探索篩選（關鍵字／風格／服務／地區）、創作者公開頁
- 接案者註冊／登入／忘記密碼、工作室編輯、價目表、作品 embed、自行上架／下架
- 頭像上傳（Storage；iPhone HEIC 會在瀏覽器轉 JPEG）
- 管理員審核（工作室、作品、社群宣傳貼文）、示範帳號、查找、註銷帳號、群發信
- 意見回饋、BUG 回報；管理員標「已修復」後，回報者可在站內點「去再試一次」再確認或重開
- 敲門（cookie 解鎖聯絡方式；`from_admin` 不計入管理員後台「本週敲門」）
- 工作室公開頁瀏覽（台北日＋訪客去重；自己預覽不算；管理員瀏覽程式端會跳過）
- 審核後台本週健康數字（註冊、瀏覽、敲門、待審、邀請碼使用率）
- 過審信會講真話：資料不齊仍不會上探索頁
- 探索頁門檻：過審 + 上架 + 非示範 + 介紹 ≥ 約 20 字 + 至少 1 支已過審作品
- 邀請碼拉新（+20 點／人）與社群宣傳送審（+100 點、每人終身一次），折抵點上限 300，只能以後折抵訂閱
- 註冊歡迎信、過審／退件／作品審核信、完善提醒、第 1／3／7 天 onboarding 催促
- Vercel Cron：每日 UTC 00:00（台北 08:00）寄管理員摘要 + 跑 onboarding 催促
- 條款、隱私權、註冊同意

**做到一半／文件過時**

- `docs/BUSINESS_PLAN.md` 仍寫敲門與後台 UV「待開發」——**程式已做**，計畫文件沒改。
- `subscription_tier`（free／pro／studio）欄位存在，作品上限已讀它，但**沒有綠界、沒有付費升級 UI**。免費上限常數是 `FREE_PORTFOLIO_LIMIT = 3`。
- `inquiries` 資料表在初始 schema，**應用程式沒有寫入或讀取**（舊「站內詢價」已放棄）。
- 公開「進行中的案子」`LIVE_BRIEFS` 目前是空陣列，刻意不放真實案主姓名。
- `web/README.md`、`web/supabase/SETUP.md` 仍寫「全新專案跑 5 個 SQL」——實際 migration 已到 `032`，上線後增量是一檔一檔在 SQL Editor 跑。

**明確沒做**

- 綠界／任何金流、Pro 訂閱結帳
- 站內聊天、評價系統、App
- 第三方分析（無 GA／PostHog 等）
- 發案者帳號體系（`profiles.role` 型別有 `client`，註冊流程是接案者）
- 自訂網域接到網站：**待確認**（寄件網域有 `mail.try-vigo.com`，網站預設仍是 `vigo-woad.vercel.app`）

**營運快照（對話紀錄，2026-10-28 審核後台，週一 10/26 起）**

- 探索頁可見約 **41** 間（目標常數 `EXPLORE_VISIBLE_TARGET = 30`，已達）
- 本週被瀏覽 2、本週非管理員敲門 **0**、本週新註冊 0
- 真實工作室約 98，其中不少未達探索門檻（當時後台「已通過未上探索」約 55）
- 結論（經營者已同意）：**停止再徵接案者，全力拉發案者進 `/explore` 並真的按敲門**。未達連續 4 週每週敲門 ≥ 20 且活躍接案者 ≥ 40，**不准收 Pro**。

---

## 2. 技術架構

### 框架、語言、主要套件（`web/package.json`）

| 項目 | 版本 |
|------|------|
| Next.js | 16.2.10（App Router） |
| React / React DOM | 19.2.4 |
| TypeScript | ^5 |
| Tailwind CSS | ^4（`@tailwindcss/postcss` ^4） |
| ESLint | ^9 + `eslint-config-next` 16.2.10 |
| `@supabase/supabase-js` | ^2.110.7 |
| `@supabase/ssr` | ^0.12.3 |
| Resend | ^6.18.1 |
| tsx（本機腳本） | ^4.20.5 |

沒有 Redux／Zustand／React Query。沒有 Prettier 設定檔。沒有單元測試套件與 `*.test.ts`。

Node：README 寫 **20+**。

### 資料夾結構

```
vigo/
├── PROJECT_CONTEXT.md     # 本文件
├── README.md              # 倉庫總覽
├── docs/                  # 商業計畫（BUSINESS_PLAN.md、EARLY_TRACTION.md）；勿把草稿亂 commit
├── reference/             # 早期 UI 靜態參考，不參與建置
├── .cursor/rules/         # Cursor 規則（繁中、做完就 push）
└── web/                   # 唯一應用程式（Vercel root）
    ├── src/app/           # 路由與頁面
    ├── src/actions/       # Server Actions
    ├── src/components/    # React 元件（依 admin／creator／dashboard／forms／…）
    ├── src/lib/           # 資料讀寫、審核門檻、email、auth、knock、referral
    ├── src/types/         # database.ts、supabase.ts
    ├── src/proxy.ts       # Next 16 的 session 更新（等同舊 middleware；matcher：dashboard／admin／登入註冊）
    ├── supabase/migrations/  # 001～032 SQL（正式庫用 Dashboard SQL Editor 跑，不是 supabase db push）
    ├── scripts/           # 偶爾手動跑的 tsx（群發、digest、完善提醒）
    ├── DEPLOY.md、README.md、.env.example
    └── vercel.json        # Cron
```

`web/src/lib` 重點：

- `data/`：creators、admin、knocks、page-views、adminHealth…
- `creator/listing.ts`：探索頁可見條件
- `email/`：寄信（`dispatchEmail` 只用 `to`，**沒有管理員 BCC**）
- `knock/`：訪客 key、cookie、文案
- `referral/config.ts`：點數規則
- `supabase/`：browser／server／public／service／proxy client

### 路由／頁面清單

| 路徑 | 用途 |
|------|------|
| `/` | 首頁（精選創作者） |
| `/explore` | 探索（`revalidate = 120`） |
| `/creator/[slug]` | 公開工作室；敲門解鎖聯絡方式 |
| `/register` | 接案者註冊（`?ref=` 邀請碼） |
| `/login`、`/forgot-password`、`/auth/update-password` | 登入與重設密碼 |
| `/auth/callback` | Supabase OAuth／magic code 換 session |
| `/dashboard` | 接案者後台（瀏覽／敲門數字、邀請碼） |
| `/dashboard/studio`、`/dashboard/profile` | 編輯工作室 |
| `/dashboard/portfolio/new` | 新增作品 |
| `/dashboard/preview` | 預覽（自己預覽不算瀏覽） |
| `/admin/review` | 審核＋本週狀況＋探索未完成名單 |
| `/admin/feedback`、`/admin/bugs` | 意見／BUG |
| `/admin/lookup` | 查找使用者 |
| `/admin/broadcast` | 群發（確認欄必須輸入「確認發送」） |
| `/admin/seed-demo`、`/admin/remove-demo` | 示範帳號（route handlers） |
| `/feedback`、`/report-bug` | 公開表單 |
| `/terms`、`/privacy` | 條款 |

API：

| 路徑 | 用途 |
|------|------|
| `POST /api/studio-view` | 記錄公開頁瀏覽（sendBeacon） |
| `GET /api/cron/admin-review-digest` | Cron；`Authorization: Bearer CRON_SECRET` |

### 資料庫、API、第三方

- **資料庫／登入／Storage：** Supabase（Postgres + Auth email/password + RLS + 頭像 bucket）。
- **網站託管：** Vercel。
- **信件：** Resend；預設 `EMAIL_FROM` 形如 `Vigo <notify@mail.try-vigo.com>`。平台通知寄**登入信箱**，不寄工作室公開聯絡 Email（見 `resolveUserNotifyEmail.ts`）。
- **金流／CMS／分析：** 無。
- **主要資料表：** `profiles`、`creator_profiles`、`portfolio_items`、`knocks`、`studio_page_views`、`feedback`、`bug_reports`、`referral_signups`、`promo_credit_transactions`、`promo_share_submissions`、`review_submission_events`、`inquiries`（未使用）。

Auth：`ADMIN_EMAIL` 對到的使用者進 `/admin/*` 會被視為管理員（`role = admin` 或信箱相符）。

### 狀態管理與樣式

- 預設 **Server Components** + Server Actions；需要瀏覽器的才加 `"use client"`。
- 敲門解鎖：httpOnly cookie + `visitor_key`（localStorage／cookie，見 `lib/knock/visitor.ts`）。
- 樣式：Tailwind v4 + `web/src/app/globals.css` 的 CSS 變數（`--accent`、`--surface`…）與 `.btn-primary` 等工具 class。無 CSS Modules。無元件庫（無 shadcn）。
- 圖片：`next.config.ts` 允許 `picsum.photos`、YouTube 縮圖、`**.supabase.co` Storage。

---

## 3. 開發與部署

### 本機安裝與啟動

```bash
cd web
npm install
cp .env.example .env.local
# 填入變數後
npm run dev
```

開 http://localhost:3000。沒有 Supabase 就沒有創作者、不能登入（沒有離線示範模式）。示範帳號要管理員在審核頁建立，且 DB 已跑過 `013_is_demo.sql`。

全新資料庫：依 `web/supabase/SETUP.md` 的精神，在 SQL Editor **依檔名數字順序**跑 `migrations/`（現已遠超過文件寫的 5 檔）。增量變更同樣貼上 Run，看到 Success 再下一檔。線上已跑到 `032`（2026-10-29 複查，見第 0 節）。

本機腳本範例（需 `--env-file=.env.local`，且部分腳本認 `VIGO_*` 別名）：

```bash
cd web
npx tsx --env-file=.env.local scripts/run-digest-once.ts
```

群發與完善信有獨立腳本；**不要重跑歷史一次性廣播**（見第 5 節）。

### 環境變數（只列名稱與用途，不要填值）

出現在 `.env.example`、`DEPLOY.md` 或程式 `process.env`：

| 名稱 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 瀏覽器／SSR anon key |
| `NEXT_PUBLIC_SITE_URL` | 站台 origin（Auth redirect、信件連結）；本機 `http://localhost:3000` |
| `ADMIN_EMAIL` | 管理員信箱；每日摘要收件人 |
| `RESEND_API_KEY` | 寄信 |
| `EMAIL_FROM` | 寄件人（需 Resend 已驗證網域） |
| `SUPABASE_SERVICE_ROLE_KEY` | 僅伺服器：群發名單、Cron、auth.admin 取登入信箱、補瀏覽。禁止 `NEXT_PUBLIC_` |
| `CRON_SECRET` | Vercel Cron Bearer |

腳本別名（非 Vercel 必填，本機／CI 偶爾用）：

| 名稱 | 對應 |
|------|------|
| `VIGO_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `VIGO_SUPABASE_ANON` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `VIGO_SERVICE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |
| `VIGO_MAIL_KEY` | `RESEND_API_KEY` |

**禁止：** 把 `.env`／金鑰 commit 進 git。經營者指示過：**不要刪「vigo-production」那把 Resend key**（對話紀錄；金鑰本體不可寫進文件）。

### 建置與測試

```bash
cd web
npm run lint     # eslint
npm run build    # next build（部署前建議）
npm run start    # 正式模式預覽
```

沒有 `npm test`。

### 部署與網域

- GitHub `main` → Vercel 專案自動建置（Root Directory = **`web`**）。
- 完成實作後經營者授權：**直接 commit 並 `git push origin HEAD`**，不要 force push、不要改 git config。
- 正式網址目前程式預設 fallback：`https://vigo-woad.vercel.app`。
- Supabase Auth 需含 `https://<正式網域>/auth/callback` 與 `http://localhost:3000/auth/callback`。
- Cron：`vercel.json` `0 0 * * *` → `/api/cron/admin-review-digest`。
- 自訂網域步驟在 `web/DEPLOY.md`；**是否已綁 try-vigo.com 到 Vercel：待確認**。

---

## 4. 程式慣例

### Cursor 規則（已從 `.cursor/rules` 原文整理）

**繁體中文（台灣）—— `traditional-chinese.mdc`（alwaysApply）**

- 聊天、說明、商業計畫、對使用者解釋的註解、commit 說明、UI 文案與錯誤訊息一律繁中。
- 台灣用詞：軟體、程式、資料庫、登入、預設、螢幕、後續、計畫、發案者、接案者。
- 禁止简体字與简繁混用。
- 例外：`signUp`、`Supabase` 等識別符；使用者明確要求英文才改英文。

**完成就 push—— `auto-push.mdc`（alwaysApply）**

- 實作完直接 commit + `git push origin HEAD`（追蹤 `main`），不必再問。
- 不要加入 `.env`、金鑰、`docs/` 未要求的草稿、一次性本機腳本。
- commit 訊息繁中、寫「為什麼」。
- 不要 force push、不要改 git config。
- 能自己做的營運動作（補寄信、改程式、靠 push 部署）直接做，不要把步驟丟回給使用者。

倉庫裡**沒有**根目錄 `.cursorrules`。`web/CLAUDE.md` 目前只 `@AGENTS.md`；`web/AGENTS.md` 是 Next.js 16 agent 提示，不是營運規則。換 Claude Code 時應先讀**本文件**。

### 命名與組織

- App Router：`page.tsx`／`route.ts`；動態段 `[slug]`。
- 元件：PascalCase 檔名（`CreatorKnockGate.tsx`）。
- Server Actions：`web/src/actions/*.ts`，檔首 `"use server"`。
- 資料讀取放 `lib/data`，純規則放 `lib/creator`、`lib/referral`、`lib/knock`。
- 路徑別名 `@/` → `web/src/`。
- 探索可見條件只維護一處：`isCreatorVisibleOnExplore`（公開頁、探索、敲門要一致）。
- 新增作品 `status: "pending"`，改 embed URL 會再送審；過審工作室的待審作品出現在審核頁「待審作品」。
- 表單：工作室 `ProfileForm` 使用 `noValidate`（避免 Safari 原生英文驗證擋 HEIC／自訂流程）。
- 時間統計用台北時區週一當週起點：`lib/time/taipei.ts`。
- 對 DB 新欄位常做 schema cache fallback（例如 `from_admin` 不存在時改查舊欄或改寫 `user_agent` 前綴 `vigo-admin|`）。

### Lint／format

- `npm run lint` → ESLint flat config `web/eslint.config.mjs`（next core-web-vitals + typescript）。
- 無 Prettier、無 Husky。

---

## 5. 在 Cursor 裡做過的重要決策

### 設計選擇與原因

| 決策 | 原因 |
|------|------|
| 逛店＋敲門，不是站內詢價表 | 發案者先看作品；聯絡資訊太早曝光會變成名冊。`inquiries` 停用。 |
| 探索門檻 20 字介紹 + 1 支過審作品 | 空殼目錄傷害發案者信任。過審 ≠ 上探索頁。 |
| 過審信必須講缺口 | 舊信讓人以為已經公開。 |
| 免費作品上限 3 | 與未來 Free／Pro 敘事一致；冷啟動曾想放寬。 |
| 敲門文案強制說來自 Vigo，但語氣要溫柔 | `lib/knock/copy.ts`。 |
| 管理員敲門：後台週統計不含，接案者後台數字仍含 | 經營者要求「當週敲門不要算管理員、對方後台可算」。`getCreatorKnockStats` **未**過濾 `from_admin`。 |
| 管理員瀏覽：兩邊都不算 | 2026-10-28 要求；應用層登入管理員直接不寫入；統計另排除管理員敲門用過的 `visitor_key`。 |
| 瀏覽 = 打開公開頁（訪客＋工作室＋台北日 unique） | 敲門是「要聯絡方式」；自己預覽不算。 |
| 通知寄登入信箱、不 BCC 管理員 | 公開聯絡 Email 可能不同；群發／通知進管理員信箱是 bug。 |
| 群發必須輸入「確認發送」 | 防止誤寄。 |
| 回報者按「已修復」才算真的修好 | 管理員標 fixed 只是通知；`user_confirmed_at` + RPC。 |
| 「去再試一次」先寫 sessionStorage 再導向 | 同 URL 的 Link 在部分情況像沒反應。 |
| 註冊不要為「名稱＝無」擋死 | 經營者：不要那麼強硬擋註冊；空殼用探索門檻濾。 |
| 公開頁不放可識別案主／個案 | `LIVE_BRIEFS = []`；曾害 Vercel 建置失敗（空陣列 `as const` 推斷成 never），改為明確 `LiveBrief[]`。 |
| 折抵點 20／100、上限 300 | 給未來訂閱折抵，不可提現。 |
| 拉發案者用 Threads，連結放第一則留言 | 主文太像廣告易被滑掉；產品 CTA 是探索頁敲門。 |
| 收費門檻（計畫） | 連續 4 週每週非管理員敲門 ≥ 20 **且**活躍接案者 ≥ 40，才做綠界。活躍定義見 `docs/BUSINESS_PLAN.md`（過審＋上架＋≥1 作品＋30 天內登入或更新）——**程式尚未實作「活躍」這個欄位統計**。 |

### 嘗試過但放棄

| 做法 | 結果 |
|------|------|
| 免費作品上限改 12 | 2026-10-28 經營者說維持 3；commit `4383429`。 |
| 首頁／探索放真實進行中 brief（含姓名） | 個資／代徵疑慮，改空陣列。 |
| 站內詢價表 `inquiries` | 改敲門。 |
| 用探索門檻卡註冊欄位 | 改成過審後再補齊；引導用 `studioSubmitGaps`，不擋送出。 |
| 為冷啟動繼續徵工作室 | 供給已過 30；需求為 0。改拉發案者。 |
| Cursor 內建 Automation 當唯一排程 | 要求「不要開著桌面才能跑」；正式路徑是 **Vercel Cron**。Cursor Automation 現況：**待確認是否還開著**。 |

### 已知問題、技術債、必須小心

**營運紅線（對話明確禁止）**

- **不要重寄 2026-10-13 那批約 36 封**（或任何舊 relaunch 廣播）除非經營者當次再說「確認發送」。
- **不要刪 vigo-production Resend key。**
- 群發／完善信可以寄，但確認欄文案必須是「確認發送」；對象要對（完善信＝已過審但未達探索門檻）。
- 管理員標 BUG fixed 後，在回報者按「已修復」前，不要對經營者宣稱「這個 bug 真正修完」。

**技術債／易踩雷**

- `web/README.md`、`SETUP.md` 的 migration 清單過期。
- `docs/BUSINESS_PLAN.md` 產品現況過期（敲門已上線）；免費期作品上限文件寫 10、程式是 3。
- `019_referral_cap_500.sql` 在工作區曾是未追蹤檔；線上上限以 `020` 的 300 為準。**待確認 019 是否曾在線上跑過。**
- 未跑的 SQL 不會隨 Vercel deploy 自動套用；DDL 要經營者在 SQL Editor 按 Run。
- `recordStudioPageViewOnce` 成功路徑常用 **service role**，RPC 裡的 `auth.uid()` 管理員檢查不可靠，所以必須在 **TS 先判斷管理員**。
- 管理員未登入開無痕瀏覽公開頁，瀏覽仍會算（無法辨識）。
- Chrome 舊版／`type=url`、Safari 大檔 RSC digest、iPhone HEIC：頭像與儲存已做過一輪，若再出現先查 `prepareAvatarFile`／`noValidate`。
- 測試／示範帳號：`is_demo`、email `@vigo.local` 或 `demo-` 前綴；群發會排除。退件帳號不應再出現在「待審」（`getPendingCreators` 只查 `pending`）。
- 空 `LIVE_BRIEFS` 不要再寫成 `[] as const` 然後 `.map`。
- 沒有自動測試；改探索門檻、敲門、寄信時要手動走一遍。
- 對話裡「謙卑群發致歉＋推薦碼換點數」是否已寄：**待確認**（曾討論文案，以有沒有「確認發送」為準）。
- 2026-10-28 本週 2 次瀏覽是否含管理員舊資料：程式已排除；032 已於 10/29 執行並回填舊資料。

---

## 6. 待辦事項（優先順序）

經營者目標是**大大提速、知道何時能收錢**。產品功能不是當前瓶頸，發案者流量才是。

1. ~~在 SQL Editor 執行 `017`、`020`、`032`~~（10/29 已完成）。剩下：用管理員登入打開一間別人的公開頁，確認本週瀏覽不增加。
2. **Threads 自動發文（10/29 程式已上線，待經營者設定）：** 依 `web/THREADS_SETUP.md` 跑 `033`、建 Meta App、填 `THREADS_APP_SECRET`、在 `/admin/threads` 貼權杖並核准文案。每天台北 12、21 點各發一篇已核准文案，自動留言放探索頁連結。
3. **只拉發案者：** 對外文連到 `/explore`，請人看完作品再敲門；不要再徵剪輯師。Threads 文案已給過多款（痛點／反直覺／踩雷／對話／二選一／創辦人／小編）；主文不放連結、第一則留言放探索頁。有人問「哪裡找」只回探索頁，**不要私訊代配**（否則敲門永遠是 0）。
3. **每週只看兩件事：** 審核後台「本週被瀏覽」「本週敲門」（不含管理員）。連續兩週敲門 ≥ 20 再開始做綠界，不要提前做。
4. **Pro／綠界：** 僅在計畫門檻達成後——連續 4 週每週敲門 ≥ 20 且活躍接案者 ≥ 40。屆時才做結帳、Free 3 支／Pro 較多作品與排序。發案者保持免費。
5. **換 Claude Code 前：** 本文件即交接包。可再把第 4 節規則縮成倉庫根目錄 `CLAUDE.md`（經營者已預告下月不續 Cursor）。每日報告已有 Vercel Cron，不必再依賴 Cursor Automation。
6. **文件同步（較低）：** 更新 `SETUP.md` migration 清單、`BUSINESS_PLAN.md` 現況（敲門／瀏覽已上線、作品上限 3）。
7. **可選、未承諾：** 敲門後「是否真的合作」回報；評價系統（計畫寫半年內不做）；自訂網域若尚未接上。

**現在不要做：** 再堆接案者、放寬探索門檻灌數量、未達標就收費、重寄 10/13 廣播、把真實案主姓名掛回首頁。

---

## 接手後建議的第一小時

1. 讀本文件 + `web/src/lib/creator/listing.ts` + `web/src/actions/knock.ts`。
2. 用管理員帳號看 `/admin/review` 本週數字（以線上為準，不要沿用 10/28 快照）。
3. 確認 Vercel 環境變數齊全、Cron 有在跑、Resend 網域還在。
4. 沒叫你做的功能先不要做；先問本週敲門是不是還接近 0。
