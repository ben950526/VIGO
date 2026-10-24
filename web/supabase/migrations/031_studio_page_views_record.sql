-- 確保瀏覽紀錄表存在，並用 RPC 寫入（不受 RLS 擋掉）
-- 已有敲門的同一天訪客，補一筆瀏覽，避免後台一直是 0

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
        and coalesce(cp.is_listed, true) = true
        and coalesce(cp.is_demo, false) = false
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

create or replace function public.record_studio_page_view(
  p_creator_id uuid,
  p_visitor_key text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_creator_id is null or p_visitor_key is null or length(trim(p_visitor_key)) < 8 then
    return;
  end if;

  insert into public.studio_page_views (creator_id, visitor_key)
  select p_creator_id, trim(p_visitor_key)
  from public.creator_profiles cp
  where cp.id = p_creator_id
    and cp.verification_status = 'approved'
    and coalesce(cp.is_listed, true) = true
    and coalesce(cp.is_demo, false) = false
    and (auth.uid() is null or cp.user_id is distinct from auth.uid());
exception
  when unique_violation then
    null;
end;
$$;

revoke all on function public.record_studio_page_view(uuid, text) from public;
grant execute on function public.record_studio_page_view(uuid, text) to anon, authenticated;

insert into public.studio_page_views (creator_id, visitor_key, created_at)
select distinct on (
  k.creator_id,
  k.visitor_key,
  (timezone('Asia/Taipei', k.created_at))::date
)
  k.creator_id,
  k.visitor_key,
  k.created_at
from public.knocks k
join public.creator_profiles cp on cp.id = k.creator_id
where coalesce(cp.is_demo, false) = false
  and k.visitor_key is not null
  and length(trim(k.visitor_key)) >= 8
  and not exists (
    select 1
    from public.studio_page_views v
    where v.creator_id = k.creator_id
      and v.visitor_key = k.visitor_key
      and (timezone('Asia/Taipei', v.created_at))::date
        = (timezone('Asia/Taipei', k.created_at))::date
  )
order by
  k.creator_id,
  k.visitor_key,
  (timezone('Asia/Taipei', k.created_at))::date,
  k.created_at;
