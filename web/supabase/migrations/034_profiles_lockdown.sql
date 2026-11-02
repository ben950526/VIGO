-- 安全修正：profiles 原本
--   1. 任何人（只要有公開的 anon key）都能讀到所有使用者的登入 Email
--   2. 登入的使用者可以把自己的 role 改成 admin（update policy 沒限制欄位）
-- 改成：只能讀自己那一筆、管理員可讀全部；一般使用者只能改 real_name。
-- 伺服器端用 service role 讀寫不受影響。可重跑。

-- 判斷目前登入者是不是管理員（security definer，避免 policy 自己查自己造成無限遞迴）
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 讀取：拿掉「所有人可讀」
drop policy if exists "Public read approved creator profiles via join" on public.profiles;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- 修改：一般使用者只能改自己的 real_name，不能改 role、email
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (real_name) on public.profiles to authenticated;

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
