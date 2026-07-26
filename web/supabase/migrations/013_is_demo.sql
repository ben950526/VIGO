-- 示範帳號標記（is_demo = true 的創作者會在 UI 顯示「示範帳號」，且不顯示聯絡方式）

alter table public.creator_profiles
  add column if not exists is_demo boolean not null default false;

create index if not exists creator_profiles_demo_idx
  on public.creator_profiles (is_demo)
  where is_demo = true;

-- 測試登入密碼：password（非必要，公開瀏覽不需登入）
create or replace function public.seed_demo_accounts()
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  demo_password constant text := '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  rec record;
begin
  if auth.uid() is null then
    raise exception '未登入';
  end if;

  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception '需要管理員權限';
  end if;

  for rec in
    select * from (values
      ('b1000001-0000-4000-8000-000000000001'::uuid, 'demo-reel-lab@vigo.local', 'reel-lab-demo', 'Reel Lab 短影工作室（示範）', true),
      ('b1000002-0000-4000-8000-000000000002'::uuid, 'demo-knowflow@vigo.local', 'knowflow-demo', 'KnowFlow 知識影音（示範）', false),
      ('b1000003-0000-4000-8000-000000000003'::uuid, 'demo-vibecut@vigo.local', 'vibecut-demo', 'Vibe Cut 趣味剪輯（示範）', false),
      ('b1000004-0000-4000-8000-000000000004'::uuid, 'demo-frame@vigo.local', 'frame-studio-demo', 'Frame Studio 質感影像（示範）', true),
      ('b1000005-0000-4000-8000-000000000005'::uuid, 'demo-shortspro@vigo.local', 'shorts-pro-demo', 'Shorts Pro 一條龍（示範）', false),
      ('b1000006-0000-4000-8000-000000000006'::uuid, 'demo-motionlab@vigo.local', 'motion-lab-demo', 'Motion Lab 動態字幕（示範）', false)
    ) as t(uid, email, slug, studio_name, featured)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      rec.uid,
      'authenticated',
      'authenticated',
      rec.email,
      demo_password,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', 'creator'),
      now(),
      now()
    )
    on conflict (id) do nothing;

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      rec.uid,
      rec.uid,
      jsonb_build_object('sub', rec.uid::text, 'email', rec.email),
      'email',
      rec.uid::text,
      now(),
      now(),
      now()
    )
    on conflict (provider, provider_id) do nothing;

    insert into public.profiles (id, email, role)
    values (rec.uid, rec.email, 'creator')
    on conflict (id) do nothing;

    insert into public.creator_profiles (
      user_id, slug, studio_name, bio,
      verification_status, featured, is_listed, is_demo,
      show_email, show_line, show_phone
    ) values (
      rec.uid,
      rec.slug,
      rec.studio_name,
      '【示範帳號】此頁僅供瀏覽 Vigo 平台介面，並非真實接案創作者，請勿聯絡或委託。',
      'approved',
      rec.featured,
      true,
      true,
      false,
      false,
      false
    )
    on conflict (slug) do update set
      studio_name = excluded.studio_name,
      bio = excluded.bio,
      verification_status = 'approved',
      is_listed = true,
      is_demo = true,
      show_email = false,
      show_line = false,
      show_phone = false,
      featured = excluded.featured,
      updated_at = now();
  end loop;

  return '已建立或更新 6 個示範帳號';
end;
$$;

revoke all on function public.seed_demo_accounts() from public;
grant execute on function public.seed_demo_accounts() to authenticated;

-- 更新撤除函式：一併清除 is_demo
create or replace function public.remove_demo_accounts()
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception '未登入';
  end if;

  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception '需要管理員權限';
  end if;

  delete from public.portfolio_items
  where creator_id in (
    select id from public.creator_profiles
    where is_demo = true or slug like '%-demo'
  );

  delete from public.creator_profiles
  where is_demo = true or slug like '%-demo';

  delete from public.profiles
  where email like 'demo-%@vigo.local';

  delete from auth.identities
  where user_id in (
    select id from auth.users where email like 'demo-%@vigo.local'
  );

  delete from auth.users where email like 'demo-%@vigo.local';

  return '已撤除假帳號';
end;
$$;
