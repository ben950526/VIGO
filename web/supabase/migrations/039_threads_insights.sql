-- 039：Threads 成效數據（2026-11-18，行銷要比較哪種文案類型最有效）
-- 1. threads_posts 加每篇的成效欄位：發出後 7 天內每天由排程更新，之後就不再更新
-- 2. 新表 threads_account_daily：帳號每天的粉絲數、個人檔案瀏覽、連結點擊
-- 兩邊都只給伺服器（service role）讀寫：開 RLS、不給 policy，和 033 一樣。
-- 可重跑；不刪任何資料。

alter table public.threads_posts
  add column if not exists views integer,
  add column if not exists likes integer,
  add column if not exists replies integer,
  add column if not exists reposts integer,
  add column if not exists quotes integer,
  add column if not exists shares integer,
  add column if not exists insights_updated_at timestamptz,
  add column if not exists insights_error text;

create table if not exists public.threads_account_daily (
  -- 台北日期
  day date primary key,
  -- 當天抓到的粉絲數快照
  followers_count integer,
  -- 當天整天的個人檔案瀏覽、連結點擊（隔天才會補齊）
  profile_views integer,
  link_clicks integer,
  error text,
  updated_at timestamptz not null default now()
);

alter table public.threads_account_daily enable row level security;

notify pgrst, 'reload schema';
