-- 敲門：發案者表達興趣，解鎖工作室詳細資料

create table if not exists public.knocks (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  visitor_key text not null,
  page_url text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists knocks_creator_id_idx on public.knocks (creator_id);
create index if not exists knocks_created_at_idx on public.knocks (created_at desc);
create index if not exists knocks_creator_created_idx on public.knocks (creator_id, created_at desc);

alter table public.knocks enable row level security;

drop policy if exists "Anyone can knock public creators" on public.knocks;
create policy "Anyone can knock public creators"
  on public.knocks for insert
  with check (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = knocks.creator_id
        and cp.verification_status = 'approved'
        and cp.is_listed = true
        and cp.is_demo = false
    )
  );

drop policy if exists "Creators read own knocks" on public.knocks;
create policy "Creators read own knocks"
  on public.knocks for select
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = knocks.creator_id and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Admins read all knocks" on public.knocks;
create policy "Admins read all knocks"
  on public.knocks for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
