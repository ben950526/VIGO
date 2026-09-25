-- 折抵點：拉新 +20、社群宣傳 +100（終身一次）、上限 300

update public.creator_profiles
set promo_credits_balance = 300
where promo_credits_balance > 300;

alter table public.creator_profiles
  drop constraint if exists creator_profiles_promo_credits_balance_check;

alter table public.creator_profiles
  add constraint creator_profiles_promo_credits_balance_check
  check (promo_credits_balance >= 0 and promo_credits_balance <= 300);

-- 舊制每筆拉新曾寫入最多 50；新制每筆最多 20。僅調整紀錄欄位以通過 check，不扣回已發折抵點。
update public.referral_signups
set credits_awarded = least(credits_awarded, 20)
where credits_awarded > 20;

alter table public.referral_signups
  drop constraint if exists referral_signups_credits_awarded_check;

alter table public.referral_signups
  add constraint referral_signups_credits_awarded_check
  check (credits_awarded >= 0 and credits_awarded <= 20);

alter table public.promo_credit_transactions
  drop constraint if exists promo_credit_transactions_reason_check;

alter table public.promo_credit_transactions
  add constraint promo_credit_transactions_reason_check
  check (reason in ('referral_signup', 'social_share'));

create table if not exists public.promo_share_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('threads', 'facebook', 'instagram', 'tiktok', 'other')),
  post_url text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  credits_awarded integer not null default 0 check (credits_awarded >= 0 and credits_awarded <= 100),
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists promo_share_submissions_user_idx
  on public.promo_share_submissions (user_id, created_at desc);

create index if not exists promo_share_submissions_pending_idx
  on public.promo_share_submissions (created_at desc)
  where status = 'pending';

create unique index if not exists promo_share_submissions_one_approved_per_user
  on public.promo_share_submissions (user_id)
  where status = 'approved';

alter table public.promo_share_submissions enable row level security;

drop policy if exists "Users read own promo share submissions" on public.promo_share_submissions;
create policy "Users read own promo share submissions"
  on public.promo_share_submissions for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own promo share submissions" on public.promo_share_submissions;
create policy "Users insert own promo share submissions"
  on public.promo_share_submissions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins read promo share submissions" on public.promo_share_submissions;
create policy "Admins read promo share submissions"
  on public.promo_share_submissions for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create or replace function public.award_referral_for_signup(
  p_referred_user_id uuid,
  p_referrer_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_user_id uuid;
  v_current_balance integer;
  v_award integer;
  v_ref text;
  v_max constant integer := 300;
  v_per_signup constant integer := 20;
begin
  if auth.uid() is distinct from p_referred_user_id then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if p_referrer_slug is null or trim(p_referrer_slug) = '' then
    return jsonb_build_object('ok', false, 'reason', 'no_ref');
  end if;

  v_ref := trim(p_referrer_slug);

  if not exists (
    select 1 from public.creator_profiles
    where user_id = p_referred_user_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'no_profile');
  end if;

  select cp.user_id into v_referrer_user_id
  from public.creator_profiles cp
  where cp.is_demo = false
    and (
      cp.invite_code = upper(v_ref)
      or cp.slug = lower(v_ref)
    )
  limit 1;

  if v_referrer_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_ref');
  end if;

  if v_referrer_user_id = p_referred_user_id then
    return jsonb_build_object('ok', false, 'reason', 'self_referral');
  end if;

  if exists (
    select 1 from public.referral_signups
    where referred_user_id = p_referred_user_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_referred');
  end if;

  select promo_credits_balance into v_current_balance
  from public.creator_profiles
  where user_id = v_referrer_user_id
  for update;

  if v_current_balance >= v_max then
    v_award := 0;
  else
    v_award := least(v_per_signup, v_max - v_current_balance);
  end if;

  insert into public.referral_signups (referrer_user_id, referred_user_id, credits_awarded)
  values (v_referrer_user_id, p_referred_user_id, v_award);

  update public.creator_profiles
  set referred_by_user_id = v_referrer_user_id
  where user_id = p_referred_user_id
    and referred_by_user_id is null;

  if v_award > 0 then
    update public.creator_profiles
    set promo_credits_balance = promo_credits_balance + v_award
    where user_id = v_referrer_user_id;

    insert into public.promo_credit_transactions (user_id, amount, reason, related_user_id)
    values (v_referrer_user_id, v_award, 'referral_signup', p_referred_user_id);
  end if;

  return jsonb_build_object('ok', true, 'credits_awarded', v_award);
end;
$$;

revoke all on function public.award_referral_for_signup(uuid, text) from public;
grant execute on function public.award_referral_for_signup(uuid, text) to authenticated;

-- 管理員審核通過社群宣傳（+100，終身一次，共用 300 上限）
create or replace function public.admin_approve_promo_share(p_submission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.promo_share_submissions%rowtype;
  v_balance integer;
  v_award integer;
  v_max constant integer := 300;
  v_share constant integer := 100;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  select * into v_row
  from public.promo_share_submissions
  where id = p_submission_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_row.status <> 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'not_pending');
  end if;

  if exists (
    select 1 from public.promo_share_submissions
    where user_id = v_row.user_id and status = 'approved' and id <> p_submission_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_claimed');
  end if;

  select promo_credits_balance into v_balance
  from public.creator_profiles
  where user_id = v_row.user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_profile');
  end if;

  if v_balance >= v_max then
    v_award := 0;
  else
    v_award := least(v_share, v_max - v_balance);
  end if;

  update public.promo_share_submissions
  set
    status = 'approved',
    credits_awarded = v_award,
    reviewed_at = now()
  where id = p_submission_id;

  if v_award > 0 then
    update public.creator_profiles
    set promo_credits_balance = promo_credits_balance + v_award
    where user_id = v_row.user_id;

    insert into public.promo_credit_transactions (user_id, amount, reason, related_user_id)
    values (v_row.user_id, v_award, 'social_share', null);
  end if;

  return jsonb_build_object('ok', true, 'credits_awarded', v_award);
end;
$$;

revoke all on function public.admin_approve_promo_share(uuid) from public;
grant execute on function public.admin_approve_promo_share(uuid) to authenticated;

create or replace function public.admin_reject_promo_share(
  p_submission_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  update public.promo_share_submissions
  set
    status = 'rejected',
    admin_note = nullif(trim(p_note), ''),
    reviewed_at = now()
  where id = p_submission_id and status = 'pending';

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found_or_not_pending');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.admin_reject_promo_share(uuid, text) from public;
grant execute on function public.admin_reject_promo_share(uuid, text) to authenticated;
