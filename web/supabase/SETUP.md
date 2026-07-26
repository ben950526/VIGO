# Supabase 資料庫設定（固定順序）

在 [Supabase Dashboard](https://supabase.com/dashboard) → 你的專案 → **SQL Editor** → **New query**，依序執行以下檔案。

> 每跑完一個檔案，確認下方顯示 **Success** 再跑下一個。  
> 檔案路徑皆在 `web/supabase/` 底下。

---

## 情境 A：全新專案（第一次設定）

從未跑過任何 SQL → **照 1 → 5 全部執行**。

| 步驟 | 檔案 | 用途 |
|------|------|------|
| **1** | `migrations/001_initial_schema.sql` | 核心表：profiles、creator_profiles、portfolio、RLS、註冊觸發 |
| **2** | `migrations/002_admin_rls.sql` | 管理員可審核所有創作者／作品 |
| **3** | `migrations/003_avatar_storage.sql` | 頭像 Storage bucket |
| **4** | `RUN_ONCE.sql` | 工作室擴充欄位、價目表、意見箱、BUG 回報、下架、示範帳號撤除函式 |
| **5** | `migrations/013_is_demo.sql` | 示範帳號標記 + 審核管理「建立示範帳號」按鈕 |

### 怎麼執行（每一步都一樣）

1. 在本機用 Cursor 打開上表對應的 `.sql` 檔案  
2. **全選 → 複製**  
3. 到 Supabase SQL Editor **貼上**  
4. 按 **Run**（或 Ctrl+Enter）  
5. 看到綠色 Success → 進下一步  

---

## 情境 B：舊專案（只跑過 001 + 002）

若你之前只依 README 跑過 `001` 和 `002`：

| 步驟 | 檔案 |
|------|------|
| 1 | `migrations/003_avatar_storage.sql` |
| 2 | `RUN_ONCE.sql` |
| 3 | `migrations/013_is_demo.sql` |

---

## 如何確認都跑成功了

在 SQL Editor 跑這段查詢：

```sql
-- 應都要有結果
select column_name from information_schema.columns
where table_name = 'creator_profiles'
  and column_name in ('price_list', 'is_listed', 'is_demo');

select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('feedback', 'bug_reports');
```

預期：
- `creator_profiles` 有 `price_list`、`is_listed`、`is_demo` 三個欄位  
- 有 `feedback`、`bug_reports` 兩張表  

### 功能對照（漏跑會怎樣）

| 漏跑 | 症狀 |
|------|------|
| 001 | 無法註冊、完全不能用 |
| 002 | 管理員看不到待審列表 |
| 003 | 上傳頭像失敗 |
| RUN_ONCE | 價目表存不了、意見箱/BUG 無法送出、無法下架 |
| 013 | 審核管理「建立示範帳號」按鈕失敗 |

---

## 建立示範帳號（可選）

Migration 跑完 **步驟 5** 之後：

1. 用 `ADMIN_EMAIL` 登入網站  
2. 開 `/admin/review`  
3. 按 **建立示範帳號**  

會建立 6 位標有「示範帳號」的創作者（含作品）。

---

## 檔案說明（不必個別跑）

以下已**包含在 RUN_ONCE.sql**，除非除錯否則不用另跑：

- `005_creator_client_fields.sql`
- `006_price_list.sql`
- `008_admin_portfolio_insert.sql`
- `009_feedback.sql`
- `010_bug_reports.sql`
- `011_remove_demo_accounts.sql`
- `012_is_listed.sql`

`013_is_demo.sql` **一定要另外跑**（更新示範帳號函式，RUN_ONCE 未包含完整版）。

---

## 正式環境 vs 本機

- **本機開發** 與 **Vercel 正式站** 可共用同一個 Supabase 專案，或分開兩個專案  
- 若分開：正式 Supabase 也要**同樣跑一遍 1～5**  
- 不建議在正式 DB 按「撤除假帳號」以外的 destructive 操作  

---

## 完成後

回終端：

```bash
cd web
npm run dev
```

測試：
- [ ] `/register` 能註冊  
- [ ] `/dashboard/profile` 能存價目表  
- [ ] `/feedback` 能送出  
- [ ] `/admin/review` 管理員能進入  

全部 OK → 可進行 **第三步：Vercel 部署環境變數**。
