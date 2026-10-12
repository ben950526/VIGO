-- 標記管理員測試敲門：對方後台仍計次，平台本週總覽可排除

alter table public.knocks
  add column if not exists from_admin boolean not null default false;

create index if not exists knocks_from_admin_created_idx
  on public.knocks (created_at desc)
  where from_admin = false;
