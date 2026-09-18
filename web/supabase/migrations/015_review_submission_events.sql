-- 送審事件佇列（供管理員每日摘要 Email）

create table if not exists public.review_submission_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('new_creator', 'profile_update', 'new_portfolio')),
  studio_name text not null,
  slug text not null,
  portfolio_title text,
  creator_user_id uuid references auth.users(id) on delete set null,
  digested_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists review_submission_events_created_idx
  on public.review_submission_events (created_at desc);

create index if not exists review_submission_events_pending_idx
  on public.review_submission_events (created_at)
  where digested_at is null;

alter table public.review_submission_events enable row level security;

drop policy if exists "Creators enqueue own review events" on public.review_submission_events;
create policy "Creators enqueue own review events"
  on public.review_submission_events for insert
  with check (auth.uid() = creator_user_id);

drop policy if exists "Admins read review events" on public.review_submission_events;
create policy "Admins read review events"
  on public.review_submission_events for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
