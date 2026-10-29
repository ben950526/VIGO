-- Threads 每日自動發文：管理員審過的文案佇列 + 長效權杖
-- 兩張表都只給伺服器（service role）讀寫；開 RLS 但不給任何 policy，瀏覽器端完全讀不到

create table if not exists public.threads_posts (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 1 and 500),
  -- 主文發出後自動留言（放探索頁連結）；空白就不留言
  first_reply text check (first_reply is null or char_length(first_reply) <= 500),
  -- 風格標籤，只是方便管理員看（痛點／反直覺／踩雷…）
  style text,
  status text not null default 'draft'
    -- posting = Cron 已領走正在發，避免兩次執行重複發同一篇
    check (status in ('draft', 'approved', 'posting', 'posted', 'failed')),
  -- 數字小的先發
  sort_order integer not null default 0,
  threads_media_id text,
  threads_permalink text,
  posted_at timestamptz,
  last_error text,
  -- 相同內容只匯入一次
  seed_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists threads_posts_queue_idx
  on public.threads_posts (sort_order, created_at)
  where status = 'approved';

alter table public.threads_posts enable row level security;

create table if not exists public.threads_credentials (
  id integer primary key default 1 check (id = 1),
  access_token text not null,
  threads_user_id text,
  threads_username text,
  expires_at timestamptz,
  refreshed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.threads_credentials enable row level security;
