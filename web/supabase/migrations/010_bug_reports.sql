-- BUG 回報（使用者遇到問題專人處理）

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
