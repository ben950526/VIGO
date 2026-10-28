-- 管理員瀏覽不計入公開統計（與 knocks.from_admin 同一套邏輯）
-- 之後寫入時直接略過；舊資料用曾標記為管理員的敲門 visitor_key 回填

alter table public.studio_page_views
  add column if not exists from_admin boolean not null default false;

create index if not exists studio_page_views_public_created_idx
  on public.studio_page_views (created_at desc)
  where from_admin = false;

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

  if auth.uid() is not null and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) then
    return;
  end if;

  insert into public.studio_page_views (creator_id, visitor_key, from_admin)
  select p_creator_id, trim(p_visitor_key), false
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

update public.studio_page_views v
set from_admin = true
where v.from_admin = false
  and exists (
    select 1
    from public.knocks k
    where k.from_admin = true
      and k.visitor_key is not null
      and k.visitor_key = v.visitor_key
  );
