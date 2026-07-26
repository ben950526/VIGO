-- 撤除所有假帳號（可重複執行，安全）
-- 刪除 slug 結尾 -demo 的創作者，以及 demo-*@vigo.local 登入帳號

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
