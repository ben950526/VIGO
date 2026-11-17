-- 038：Threads 自動發文改成「Blaze Atlas Studio」工作室帳號，替四個專案輪流發文（2026-11-17）
-- threads_posts 加「專案」欄位；舊資料都是 Vigo 的文案，預設 vigo。
-- 可重跑；不刪任何資料。

alter table public.threads_posts
  add column if not exists project text not null default 'vigo';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'threads_posts_project_check'
      and conrelid = 'public.threads_posts'::regclass
  ) then
    alter table public.threads_posts
      add constraint threads_posts_project_check
      check (project in ('vigo', 'med', 'storybook', 'logicgym'));
  end if;
end $$;

create index if not exists threads_posts_project_idx
  on public.threads_posts (project, status);

-- 讓 PostgREST 立刻認得新欄位
notify pgrst, 'reload schema';
