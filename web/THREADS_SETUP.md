# Threads 自動發文：一次性設定步驟

整個流程大約 20～30 分鐘，只需要做一次。之後權杖會自動續期，不必再碰。

你會用到：
- 一台電腦的瀏覽器（手機也行，但電腦比較好操作）
- 你的 Facebook 帳號（Meta 開發者後台用 Facebook 登入）
- 你要拿來發文的 Threads 帳號
- Vercel 與 Supabase 的登入

> 安全提醒：**App 密鑰（App Secret）和權杖都等於密碼**。只貼在本文件指定的兩個地方（Vercel 環境變數、Vigo 後台），不要貼到聊天、截圖分享或寫進程式。

---

## 第 0 步：先在 Supabase 建立資料表

1. 登入 Supabase，打開 Vigo 專案。
2. 左側選 **SQL Editor** → **New query**。
3. 打開 `web/supabase/migrations/033_threads_autopost.sql`，全選複製，貼上後按 **Run**。
4. 看到 **Success** 就完成。

---

## 第 1 步：建立 Meta 開發者帳號（已經有就跳過）

1. 打開 https://developers.facebook.com/ ，右上角 **登入**（用 Facebook 帳號）。
2. 第一次進來會要你「註冊成為開發者」：照畫面同意條款、驗證手機或 Email 即可。

---

## 第 2 步：建立 App，選 Threads 用途

1. 打開 https://developers.facebook.com/apps ，按 **建立應用程式（Create App）**。
2. **應用程式名稱**：例如 `Vigo Threads 發文`。聯絡 Email 填你的信箱。按 **下一步**。
3. **用途（Use case）**：選 **「存取 Threads API（Access the Threads API）」**，按 **下一步**。
4. 如果問你要連結哪個 **商家資產組合（Business Portfolio）**：選「我還不想連結」或任一個都可以（自己的帳號發文不影響）。
5. 之後的「發佈要求」頁面直接按 **下一步**，最後按 **前往主控板（Go to Dashboard）**。

---

## 第 3 步：設定 Threads 權限

1. 在主控板找到 **「自訂『存取 Threads API』用途」（Customize the Access the Threads API use case）** 並點進去。
2. 在 **權限（Permissions）** 裡，確認下面三個是「已新增（Added）」，沒有就按旁邊的 **新增（Add）**：
   - `threads_basic`（基本，預設就有）
   - `threads_content_publish`（發文）
   - `threads_manage_replies`（自動留言要用）
3. 切到 **設定（Settings）** 分頁：
   - **回呼網址（Redirect Callback URLs）**、**解除授權回呼網址**、**刪除資料回呼網址**：三格都填 `https://vigo-woad.vercel.app/` 即可（我們不用這些，但欄位必填）。
   - 同一頁會看到 **Threads 應用程式編號（Threads App ID）** 和 **Threads 應用程式密鑰（Threads App Secret）**。
4. 按 **儲存**。

> 注意：主控板會有兩組編號／密鑰。要用的是 **Threads 那一組**（在 Threads 用途的設定頁），不是「應用程式設定 → 基本資料」裡的 Facebook 那組。

---

## 第 4 步：把自己的 Threads 帳號加成測試人員

自己的帳號只要是測試人員，就不用送 Meta 審核。

1. 左側選 **應用程式角色（App roles）** → **角色（Roles）**。
2. 按 **新增人員（Add People）** → 選 **Threads 測試人員（Threads Tester）**。
3. 輸入你的 **Threads 帳號名稱**（不含 @），按 **新增**。狀態會顯示「待處理（Pending）」。
4. 到 Threads 接受邀請：
   - 電腦：打開 https://www.threads.com/settings/account → **網站權限（Website permissions）** → **邀請（Invites）** 分頁 → 按 **接受**。
   - 手機 App：**設定 → 帳號 → 網站權限 → 邀請**。
   - 沒看到邀請的話，等幾分鐘再重新整理。
5. 回到 Meta 主控板，重新整理，狀態變成正常就好了。

---

## 第 5 步：把 App 密鑰填進 Vercel

1. 回到第 3 步的 Threads 設定頁，**Threads 應用程式密鑰** 旁邊按 **顯示**（可能要再輸入一次 Facebook 密碼），複製下來。
2. 登入 https://vercel.com ，打開 **vigo** 專案 → 上方 **Settings** → 左側 **Environment Variables**。
3. 新增一筆：
   - **Key**：`THREADS_APP_SECRET`
   - **Value**：貼上剛剛複製的密鑰
   - **Environments**：勾 **Production**（Preview 可不勾）
4. 按 **Save**。
5. 讓設定生效：上方 **Deployments** → 最上面那筆右邊的 **⋯** → **Redeploy** → 確認。等狀態變成 **Ready**。

---

## 第 6 步：產生權杖，貼到 Vigo 後台

1. 打開 https://developers.facebook.com/tools/explorer/ （Graph API 測試工具）。
2. 右上角 **Meta 應用程式** 選你剛建立的 `Vigo Threads 發文`。
3. 左上角的網域下拉選單，從 `graph.facebook.com` 改成 **`threads.net`**（或 threads.com）。
4. 按 **產生 Threads 存取權杖（Generate Threads Access Token）**。
5. 會跳出 Threads 授權視窗：用你的 Threads 帳號登入，勾選全部權限，按 **允許**。
6. 回到測試工具，**存取權杖** 欄位就是你的權杖（很長一串，通常 `TH` 開頭）。按旁邊的複製。
7. **一小時內**（短效權杖 1 小時就過期）打開 https://vigo-woad.vercel.app/admin/threads （用管理員帳號登入）。
8. 在 **帳號連結** 貼上權杖，按 **連結**。
9. 看到「已連結 Threads 帳號 @你的帳號」，並顯示權杖到期日（約 60 天後）就成功了。之後系統會在到期前自動續期。

> 如果出現「Vercel 尚未設定 THREADS_APP_SECRET」：回第 5 步確認變數名稱沒打錯、而且有 Redeploy。

---

## 第 7 步：匯入文案、核准

1. 在 `/admin/threads` 按 **匯入預設文案（草稿）**，會匯入 28 篇草稿（兩週份）。
2. **逐篇看過**，要改就直接改，改完按 **核准發文**；不喜歡的按 **刪除這篇**。
3. 只有「已核准」的會發。順序數字小的先發。
4. 想先試一篇：按 **現在發下一篇**，會**立刻公開發到 Threads**，並自動留言放探索頁連結。去 Threads 看一下有沒有正常。

---

## 之後怎麼運作

- 每天 **台北 12 點、21 點** 各發一篇（Vercel 免費方案會在那個小時內的某個時間執行，不一定剛好整點）。
- 發完會自動在底下留言放探索頁連結。
- 「排隊中」少於 6 篇時，後台會提示快沒文案了，記得補新文案或請 Claude 再寫一批。
- 想暫停：把已核准的改回草稿，或按 **解除連結**。

## 常見問題

| 狀況 | 怎麼辦 |
|------|--------|
| 連結時說權杖無效或過期 | 短效權杖只有 1 小時，回第 6 步重新產生一次再貼 |
| 發文失敗：沒有權限 | 第 3 步的三個權限有沒有都加；第 6 步授權時有沒有全部勾 |
| 主文發了、留言失敗 | 缺 `threads_manage_replies` 權限，補上後回第 6 步重新產生權杖、重新連結 |
| 一直卡在「發送中」 | 先到 Threads 看有沒有發出去，再按「卡住了？標為失敗」 |
