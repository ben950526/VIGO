-- 註冊滿約三天後的一次提醒信，每人只寄一次
alter table public.creator_profiles
  add column if not exists onboarding_day3_sent_at timestamptz;
