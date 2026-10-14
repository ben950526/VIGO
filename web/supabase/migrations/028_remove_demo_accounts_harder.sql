-- 撤除示範帳時先清關聯資料；並避免只刪作品、工作室還留著

create or replace function public.remove_demo_accounts()
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  demo_ids uuid[];
  demo_users uuid[];
  removed int;
begin
  if auth.uid() is null then
    raise exception '未登入';
  end if;

  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception '需要管理員權限';
  end if;

  select coalesce(array_agg(id), '{}') into demo_ids
  from public.creator_profiles
  where is_demo = true or slug like '%-demo';

  select coalesce(array_agg(user_id), '{}') into demo_users
  from public.creator_profiles
  where id = any (demo_ids);

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'knocks'
  ) then
    delete from public.knocks where creator_id = any (demo_ids);
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'inquiries'
  ) then
    delete from public.inquiries where creator_id = any (demo_ids);
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'studio_page_views'
  ) then
    delete from public.studio_page_views where creator_id = any (demo_ids);
  end if;

  delete from public.portfolio_items where creator_id = any (demo_ids);

  delete from public.creator_profiles
  where is_demo = true or slug like '%-demo';
  get diagnostics removed = row_count;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'promo_share_submissions'
  ) then
    delete from public.promo_share_submissions
    where user_id in (select id from public.profiles where email like 'demo-%@vigo.local')
       or user_id = any (demo_users);
  end if;

  delete from public.profiles
  where email like 'demo-%@vigo.local'
     or id = any (demo_users);

  delete from auth.identities
  where user_id in (
    select id from auth.users where email like 'demo-%@vigo.local'
  ) or user_id = any (demo_users);

  delete from auth.users
  where email like 'demo-%@vigo.local'
     or id = any (demo_users);

  return '已撤除假帳號（' || removed || ' 間工作室）';
end;
$$;
