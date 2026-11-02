-- 發案者 Google 登入後的第 1／3／7 天提醒信
-- 需先跑 034（profiles 權限修正），這些欄位才不會被別人讀到。可重跑。

alter table public.profiles
  add column if not exists client_marketing_consent_at timestamptz,
  add column if not exists client_nudge_1d_sent_at timestamptz,
  add column if not exists client_nudge_3d_sent_at timestamptz,
  add column if not exists client_nudge_7d_sent_at timestamptz,
  add column if not exists email_opt_out boolean not null default false,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists profiles_unsubscribe_token_idx
  on public.profiles (unsubscribe_token);

-- Cron 只掃最近登入的發案者
create index if not exists profiles_client_created_idx
  on public.profiles (created_at desc)
  where role = 'client';
