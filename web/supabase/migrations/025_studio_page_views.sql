-- 工作室公開頁被瀏覽（同一訪客同一天只記一次）

create table if not exists public.studio_page_views (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  visitor_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists studio_page_views_unique_day
  on public.studio_page_views (
    creator_id,
    visitor_key,
    ((timezone('Asia/Taipei', created_at))::date)
  );

create index if not exists studio_page_views_creator_created_idx
  on public.studio_page_views (creator_id, created_at desc);

alter table public.studio_page_views enable row level security;

drop policy if exists "Anyone can record public studio views" on public.studio_page_views;
create policy "Anyone can record public studio views"
  on public.studio_page_views for insert
  with check (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = studio_page_views.creator_id
        and cp.verification_status = 'approved'
        and cp.is_listed = true
        and cp.is_demo = false
    )
  );

drop policy if exists "Creators read own studio views" on public.studio_page_views;
create policy "Creators read own studio views"
  on public.studio_page_views for select
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = studio_page_views.creator_id and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Admins read all studio views" on public.studio_page_views;
create policy "Admins read all studio views"
  on public.studio_page_views for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

grant insert on public.studio_page_views to anon, authenticated;
grant select on public.studio_page_views to authenticated;
