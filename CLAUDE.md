# Vigo — Claude Code 工作規則

完整背景與待辦見根目錄 `PROJECT_CONTEXT.md`（交接文件）。開新對話時先讀它；標「待確認」的項目不要當事實寫進程式，先向經營者核對。

Next.js 16 的版本差異提示見 `web/AGENTS.md`（寫程式前先查 `web/node_modules/next/dist/docs/`）。

## 語言：一律繁體中文（台灣）

- 聊天、說明、註解、commit 訊息、UI 文案、錯誤訊息都用繁中。
- 台灣用詞：軟體、程式、資料庫、登入、預設、螢幕、後續、計畫、發案者、接案者。
- 禁止简体字與简繁混用。
- 例外：程式識別符與 API 名稱（`signUp`、`Supabase`…）維持英文；使用者明確要求英文才改。

## Git：做完就 commit + push

- 實作完成後直接 commit 並 `git push origin HEAD`（追蹤 `main`，Vercel 會自動部署），不必再問。
- commit 訊息用繁中，寫「為什麼」。
- **不要 force push、不要改 git config。**
- **不要 commit `.env`、任何金鑰**，也不要 commit `docs/` 裡沒被要求的草稿或一次性本機腳本。
- 能自己做的事（改程式、靠 push 部署）直接做，不要把步驟丟回給使用者。

## 營運紅線（絕對不要做）

- **不要重寄 2026-10-13 那批約 36 封廣播**（或任何舊 relaunch 廣播），除非經營者當次明確說「確認發送」。
- **不要刪 Resend 的「vigo-production」那把 key。**
- 群發／完善信的確認欄必須輸入「確認發送」才能寄；對象要對（完善信＝已過審但未達探索門檻）。
- 管理員標 BUG「已修復」後，回報者按「已修復」之前，不要對經營者說這個 bug 已經真正修好。
- 不要對發案者收費；未達門檻（連續 4 週每週非管理員敲門 ≥ 20 **且**活躍接案者 ≥ 40）不要做綠界／Pro 收費。
- 不要再堆接案者、不要放寬探索門檻灌數量、不要把真實案主姓名掛回首頁（`LIVE_BRIEFS` 保持空陣列，型別寫明確 `LiveBrief[]`，不要寫 `[] as const`）。
- 沒被要求的新功能先不要做。

## 程式慣例重點

- 應用程式都在 `web/`（Vercel Root Directory）。指令：`npm run lint`、`npm run build`；沒有自動測試，改探索門檻、敲門、寄信時要手動走一遍。
- 探索可見條件只維護一處：`web/src/lib/creator/listing.ts` 的 `isCreatorVisibleOnExplore`（探索頁、公開頁、敲門要一致）。
- Server Actions 放 `web/src/actions/`；資料讀取放 `lib/data`；純規則放 `lib/creator`、`lib/referral`、`lib/knock`。路徑別名 `@/` → `web/src/`。
- 資料庫 migration 在 `web/supabase/migrations/`，正式庫由經營者在 Supabase SQL Editor 手動執行，**不會**隨部署自動套用；新欄位要做 schema cache fallback。
- `SUPABASE_SERVICE_ROLE_KEY` 只能在伺服器端，禁止加 `NEXT_PUBLIC_`。
- 通知信寄登入信箱，不 BCC 管理員。
- 週統計用台北時區週一起算（`lib/time/taipei.ts`）；管理員的瀏覽與敲門不計入後台週統計。
