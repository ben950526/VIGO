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

## 工作流程

- **先讀再改**：動手前先讀相關檔案與呼叫端，不憑印象改；不確定 Next.js 16 API 時查 `web/node_modules/next/dist/docs/`。
- **較大的改動先講計畫**：會動到 3 個以上檔案、資料庫結構、寄信或敲門流程時，先用幾句話說要改什麼、為什麼，再動手。
- **改最小範圍**：只改任務需要的地方，不順手重構、不改無關檔案的格式或命名。看到別的問題就記下來回報，不要直接改。
- **不確定就問，不要猜**：需求不清楚、或文件標「待確認」時，先問經營者。
- **不要擅自加套件**：要新增 npm 套件先說明理由並徵求同意。

## 完成前的驗證（push 前一定要做）

- 在 `web/` 跑 `npm run build`，**必須成功才能 push**（曾因型別錯誤連續兩次 Vercel 部署失敗卻沒人發現）。
- 跑 `npm run lint`，**必須 0 個錯誤**（警告可以先留著）。
- 動到 UI 時，要考慮手機版（流量多來自 Threads，iPhone Safari 為主）。
- push 後可用 `https://api.github.com/repos/ben950526/VIGO/commits/<sha>/status` 確認 Vercel 部署成功。
- 回報時要老實說：哪些有驗證、哪些沒驗證（例如「build 過了，但沒在正式站實際點過」）。

## 資料庫與安全

- **不要修改已存在的 migration 檔**；變更一律新增下一個編號的檔案（目前到 `032`），並用 `if not exists`／`create or replace` 寫成可重跑。
- 新增的資料表一定要開 RLS 並寫 policy；權限檢查要在伺服器端做，不能只靠前端隱藏。
- 新增 migration 後要提醒經營者到 Supabase SQL Editor 執行，並告訴他檔案路徑；執行後可用 anon key 唯讀查詢確認欄位存在。
- 檢查正式資料時只做唯讀查詢；任何寫入、刪除正式資料前都要先問。
- 不要把金鑰、個資或真實使用者 Email 印到輸出或寫進程式與文件。

## 文件同步

- 事實有變動時（migration 已執行、功能上線、待確認項目有答案），順手更新 `PROJECT_CONTEXT.md` 相關段落，跟程式一起 commit。
- 這份 `CLAUDE.md` 只放「每次都要遵守的規則」，細節與現況寫在 `PROJECT_CONTEXT.md`，保持精簡。

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
