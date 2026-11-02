# 發案者 Google 登入：一次性設定步驟

做完之前，網站維持現狀（發案者不用登入就能逛）。**全部設定好、自己測過能登入之後**，才打開第 5 步的開關。

> 安全提醒：Google 的「用戶端密鑰（Client Secret）」等於密碼，只貼在 Supabase 後台，不要貼到聊天或截圖分享。

---

## 第 0 步：先跑兩個 SQL（一定要照順序）

Supabase → **SQL Editor** → **New query**，貼上執行，看到 Success 再跑下一個：

1. `web/supabase/migrations/034_profiles_lockdown.sql`：**安全修正，請越快越好**。修好「任何人都讀得到所有使用者 Email」與「使用者能自己改成管理員」兩個漏洞。
2. `web/supabase/migrations/035_client_login_nudges.sql`：發案者提醒信要用的欄位。

跑完 034 後，請用管理員帳號登入一次 `/admin/review`，確認後台還能正常打開。

---

## 第 1 步：在 Google Cloud 建立 OAuth 用戶端

1. 打開 https://console.cloud.google.com/ ，用你的 Google 帳號登入。
2. 上方專案選單 → **新增專案**，名稱例如 `Vigo`，建立後切換到這個專案。
3. 左側選單 → **API 和服務** → **OAuth 同意畫面**（新版介面叫 **Google Auth Platform**）→ **開始使用**：
   - 應用程式名稱：`Vigo`
   - 使用者支援電子郵件：你的信箱
   - 目標對象：選 **外部（External）**
   - 聯絡資訊：你的信箱 → 同意政策 → **建立**
4. 同一區的 **品牌宣傳（Branding）**：
   - 應用程式首頁：`https://vigo-woad.vercel.app`
   - 隱私權政策：`https://vigo-woad.vercel.app/privacy`
   - 服務條款：`https://vigo-woad.vercel.app/terms`
   - 授權網域：加入 `vercel.app` 和 `supabase.co`
5. **目標對象（Audience）** → 發布狀態按 **發布應用程式（Publish app）**，改成「正式版」。
   （不發布的話只有你加進測試名單的人能登入。只要求 Email 和基本資料，通常不需要 Google 審核。）
6. **用戶端（Clients）** → **建立用戶端**：
   - 應用程式類型：**網頁應用程式**
   - 名稱：`Vigo 網站`
   - **已授權的重新導向 URI**：按新增，貼上
     `https://hyrrssbdutwuhmuyctot.supabase.co/auth/v1/callback`
   - 按 **建立**
7. 畫面會顯示 **用戶端 ID** 和 **用戶端密鑰**，兩個都先複製起來（下一步要用）。

---

## 第 2 步：在 Supabase 打開 Google 登入

1. Supabase → 你的專案 → 左側 **Authentication** → **Sign In / Providers**（或 Providers）。
2. 找到 **Google** → 打開 **Enable**。
3. 貼上第 1 步的 **Client ID** 和 **Client Secret** → **Save**。

---

## 第 3 步：允許登入後導回網站

1. Supabase → **Authentication** → **URL Configuration**。
2. **Site URL** 維持 `https://vigo-woad.vercel.app`。
3. **Redirect URLs** 確認有下面這筆（沒有就 **Add URL**）：
   - `https://vigo-woad.vercel.app/**`

---

## 第 4 步：自己測一次（開關還沒打開）

1. 用**無痕視窗**打開 https://vigo-woad.vercel.app/join
2. 按「使用 Google 帳號繼續」，選一個**不是管理員、也沒註冊過接案者**的 Google 帳號。
3. 應該會回到探索頁，右上角出現「逛工作室」和「登出」。
4. 到 `/admin/lookup` 查這個 Email，角色應該是 `client`。

有任何一步失敗，先不要開開關，把錯誤畫面截圖給 Claude。

---

## 第 5 步：打開「要登入才能逛」

1. Vercel → vigo → **Settings** → **Environment Variables** → 新增：
   - Key：`REQUIRE_CLIENT_LOGIN`
   - Value：`1`
   - Environments：Production
2. **Deployments** → 最上面那筆 **⋯** → **Redeploy**。
3. 用無痕視窗打開 `/explore`，應該會先跳到登入頁。

想關掉：把這個變數刪掉或改成 `0`，再 Redeploy 一次。

---

## 之後怎麼運作

- 沒登入的人打開探索頁或工作室頁，會先到 `/join` 用 Google 登入，登入完回到原本要看的頁面。
- 首頁、條款、隱私權、接案者註冊頁不用登入。
- 發案者登入後第 1、3、7 天（台北早上 8 點左右）各收到一封提醒信，信裡可以一鍵取消。
- 發案者不會收到群發信。
