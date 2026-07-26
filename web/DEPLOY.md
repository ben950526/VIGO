# 部署到 Vercel（第三步）

架構：**Vercel 跑網站** + **Supabase 跑資料庫／登入**（沿用你已設定好的 Supabase，不用再跑 migration，除非開新專案）。

---

## 前置：程式已在 GitHub

若還沒推上去：

```bash
cd C:\vigo
git init          # 若尚未
git add .
git commit -m "Vigo MVP"
git remote add origin https://github.com/你的帳號/vigo.git
git push -u origin main
```

已有 repo 就略過。

---

## 步驟 1：Vercel 建立專案

1. 開啟 https://vercel.com 並登入（建議用 GitHub 帳號）
2. 點 **Add New → Project**
3. **Import** 你的 `vigo` repository
4. **重要：Root Directory**
   - 點 **Edit** → 選 **`web`**
   - （repo 根目錄是 `vigo/`，Next.js 在 `vigo/web/`）
5. Framework 應自動辨識為 **Next.js**，不用改 Build 設定：
   - Build Command: `npm run build`
   - Output: 預設即可

**先不要按 Deploy** → 先做步驟 2 環境變數。

---

## 步驟 2：Vercel 環境變數

在 Import 畫面的 **Environment Variables**，新增 4 個：

| Name | Value | 哪裡找 |
|------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | 同上 → anon public |
| `NEXT_PUBLIC_SITE_URL` | `https://你的專案.vercel.app` | 部署後 Vercel 給的網址；不確定可先填 `https://vigo-xxx.vercel.app`，部署完再改 |
| `ADMIN_EMAIL` | `benten950526@gmail.com` | 你的管理員信箱（**不要**加 NEXT_PUBLIC_） |

勾選 **Production**（Preview 也可一併勾，方便測 PR）。

> `NEXT_PUBLIC_*` 會暴露給瀏覽器，只能放 Supabase **anon key**，絕對不要放 service_role key。

然後按 **Deploy**，等 1–3 分鐘。

---

## 步驟 3：記下正式網址

部署成功後 Vercel 會顯示網址，例如：

```
https://vigo-web-abc123.vercel.app
```

1. 若步驟 2 的 `NEXT_PUBLIC_SITE_URL` 是猜的，到 Vercel → **Settings → Environment Variables** 改成**實際網址**
2. **Redeploy** 一次（Deployments → 最新那筆 → ⋮ → Redeploy）

---

## 步驟 4：Supabase Auth 網址（必做）

1. 開 [Supabase Dashboard](https://supabase.com/dashboard) → 你的專案
2. **Authentication** → **URL Configuration**
3. 設定：

| 欄位 | 填什麼 |
|------|--------|
| **Site URL** | `https://你的專案.vercel.app` |
| **Redirect URLs** | 新增以下兩行（各一行）： |

```
https://你的專案.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

第二行保留，本機開發才登入得了。

4. 按 **Save**

---

## 步驟 5：Email 確認（建議檢查）

Supabase → **Authentication** → **Providers** → **Email**

- 若 **Confirm email** 有開：使用者註冊後要收信點連結才能登入
- MVP 想省事：可先**關閉** Confirm email，註冊完直接能登入

---

## 步驟 6：上線驗收

用正式網址測：

- [ ] 首頁 / 探索 有創作者
- [ ] `/register` 註冊 → `/dashboard`
- [ ] `/dashboard/profile` 存資料
- [ ] `/admin/review` 管理員能進
- [ ] `/feedback` 能送出

---

## 自訂網域（可選，之後再做）

1. Vercel → Project → **Settings → Domains** → 加入你的網域
2. 依 DNS 指示設定
3. 更新 Vercel 的 `NEXT_PUBLIC_SITE_URL` 為 `https://你的網域`
4. 更新 Supabase Site URL + Redirect URLs 為同一網域
5. Redeploy

---

## 常見問題

| 問題 | 原因 / 解法 |
|------|-------------|
| 部署後探索頁空的 | 環境變數 Supabase URL/Key 填錯；或連到不同 Supabase 專案 |
| 註冊後登入失敗 | Redirect URLs 沒加 `/auth/callback` |
| 管理員進不了審核 | `ADMIN_EMAIL` 未設或未 Redeploy；要用該信箱註冊 |
| 本機 OK、正式站不行 | `NEXT_PUBLIC_SITE_URL` 還是 localhost |

---

## 完成

三步都做完 = **README ✅ → Migration ✅ → Vercel ✅**

之後改程式：`git push` → Vercel 自動重新部署。
