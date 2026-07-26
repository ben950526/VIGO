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
