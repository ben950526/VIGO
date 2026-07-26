-- 撤除所有假帳號（slug 結尾 -demo 或 email demo-*@vigo.local）
-- 可重複執行；也可由管理員在後台觸發 RPC

create or replace function public.remove_demo_accounts()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  removed_profiles int;
begin
  if auth.uid() is null then
    raise exception '未登入';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception '需要管理員權限';
  end if;

  delete from public.portfolio_items
  where creator_id in (
    select id from public.creator_profiles where slug like '%-demo'
  );

  delete from public.creator_profiles where slug like '%-demo';

  delete from public.profiles
  where email like 'demo-%@vigo.local';

  delete from auth.identities
  where user_id in (
    select id from auth.users where email like 'demo-%@vigo.local'
  );

  delete from auth.users where email like 'demo-%@vigo.local';

  get diagnostics removed_profiles = row_count;
  return '已撤除假帳號';
end;
$$;

revoke all on function public.remove_demo_accounts() from public;
grant execute on function public.remove_demo_accounts() to authenticated;
