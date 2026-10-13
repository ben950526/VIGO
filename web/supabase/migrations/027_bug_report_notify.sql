-- BUG 回報可留下聯絡信箱，修好後寄信說明怎麼重試

alter table public.bug_reports
  add column if not exists reporter_id uuid references auth.users (id) on delete set null,
  add column if not exists contact_email text,
  add column if not exists user_reply text,
  add column if not exists notified_at timestamptz;

create index if not exists bug_reports_reporter_id_idx
  on public.bug_reports (reporter_id)
  where reporter_id is not null;
