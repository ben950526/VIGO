-- Vigo：步驟 4/5（請先跑完 001、002、003）
-- 補上工作室合作欄位、價目表、意見箱、BUG、下架、撤除假帳號函式
-- 步驤 5 還需跑 migrations/013_is_demo.sql
-- 完整說明：supabase/SETUP.md

alter table public.creator_profiles
  add column if not exists turnaround text,
  add column if not exists revision_policy text,
  add column if not exists response_time text,
  add column if not exists team_size text,
  add column if not exists platforms text[] not null default '{}',
  add column if not exists client_types text[] not null default '{}',
  add column if not exists languages text[] not null default '{}',
  add column if not exists typical_scope text,
  add column if not exists website_url text,
  add column if not exists price_list jsonb not null default '[]'::jsonb;

-- 允許管理員替其他創作者補充作品
drop policy if exists "Admins insert portfolio items" on public.portfolio_items;

create policy "Admins insert portfolio items"
  on public.portfolio_items for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- MVP 使用者意見回饋
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(trim(message)) >= 2),
  role text check (role in ('client', 'creator', 'visitor')),
  contact_email text,
  page_url text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "Anyone can submit feedback" on public.feedback;
create policy "Anyone can submit feedback"
  on public.feedback for insert
  with check (true);

drop policy if exists "Admins read feedback" on public.feedback;
create policy "Admins read feedback"
  on public.feedback for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- BUG 回報
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(trim(message)) >= 2),
  steps text,
  page_url text,
  user_agent text,
  viewport text,
  status text not null default 'open' check (status in ('open', 'investigating', 'fixed', 'wont_fix')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bug_reports_status_created_idx
  on public.bug_reports (status, created_at desc);

alter table public.bug_reports enable row level security;

drop policy if exists "Anyone can submit bug reports" on public.bug_reports;
create policy "Anyone can submit bug reports"
  on public.bug_reports for insert
  with check (true);

drop policy if exists "Admins read bug reports" on public.bug_reports;
create policy "Admins read bug reports"
  on public.bug_reports for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins update bug reports" on public.bug_reports;
create policy "Admins update bug reports"
  on public.bug_reports for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 後台一鍵撤除假帳號
create or replace function public.remove_demo_accounts()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception '未登入';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception '需要管理員權限';
  end if;

  delete from public.portfolio_items
  where creator_id in (
    select id from public.creator_profiles where slug like '%-demo'
  );

  delete from public.creator_profiles where slug like '%-demo';

  delete from public.profiles
  where email like 'demo-%@vigo.local';

  delete from auth.identities
  where user_id in (
    select id from auth.users where email like 'demo-%@vigo.local'
  );

  delete from auth.users where email like 'demo-%@vigo.local';

  return '已撤除假帳號';
end;
$$;

revoke all on function public.remove_demo_accounts() from public;
grant execute on function public.remove_demo_accounts() to authenticated;

-- 創作者可自行下架
alter table public.creator_profiles
  add column if not exists is_listed boolean not null default true;

create index if not exists creator_profiles_listed_idx
  on public.creator_profiles (is_listed)
  where verification_status = 'approved';

drop policy if exists "Anyone can read approved creators" on public.creator_profiles;
create policy "Anyone can read approved creators"
  on public.creator_profiles for select
  using (
    (verification_status = 'approved' and is_listed = true)
    or auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Anyone can read approved portfolio items" on public.portfolio_items;
create policy "Anyone can read approved portfolio items"
  on public.portfolio_items for select
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = portfolio_items.creator_id and cp.user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
    or (
      status = 'approved'
      and exists (
        select 1 from public.creator_profiles cp
        where cp.id = portfolio_items.creator_id
          and cp.verification_status = 'approved'
          and cp.is_listed = true
      )
    )
  );

-- 示範帳號：請另執行 supabase/migrations/013_is_demo.sql
