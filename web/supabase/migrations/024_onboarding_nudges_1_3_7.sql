-- 新用戶註冊後第 1、3、7 天各一封提醒（僅不完善工作室；不補寄舊帳）

alter table public.creator_profiles
  add column if not exists onboarding_nudge_1d_sent_at timestamptz;

alter table public.creator_profiles
  add column if not exists onboarding_nudge_3d_sent_at timestamptz;

alter table public.creator_profiles
  add column if not exists onboarding_nudge_7d_sent_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'creator_profiles'
      and column_name = 'onboarding_day3_sent_at'
  ) then
    update public.creator_profiles
    set onboarding_nudge_3d_sent_at = onboarding_day3_sent_at
    where onboarding_day3_sent_at is not null
      and onboarding_nudge_3d_sent_at is null;
  end if;
end $$;
