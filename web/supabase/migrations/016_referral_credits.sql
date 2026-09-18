-- 推廣折抵點：專屬連結拉新註冊 +50 點，累積上限 1000（僅供未來訂閱折抵，不可換現）

alter table public.creator_profiles
  add column if not exists referred_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists promo_credits_balance integer not null default 0
    check (promo_credits_balance >= 0 and promo_credits_balance <= 1000);

create index if not exists creator_profiles_referred_by_idx
  on public.creator_profiles (referred_by_user_id)
  where referred_by_user_id is not null;

create table if not exists public.referral_signups (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  credits_awarded integer not null default 0 check (credits_awarded >= 0 and credits_awarded <= 50),
  created_at timestamptz not null default now()
);

create index if not exists referral_signups_referrer_idx
  on public.referral_signups (referrer_user_id, created_at desc);

create table if not exists public.promo_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount > 0),
  reason text not null check (reason in ('referral_signup')),
  related_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists promo_credit_transactions_user_idx
  on public.promo_credit_transactions (user_id, created_at desc);

alter table public.referral_signups enable row level security;
alter table public.promo_credit_transactions enable row level security;

drop policy if exists "Users read own referral signups" on public.referral_signups;
create policy "Users read own referral signups"
  on public.referral_signups for select
  using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

drop policy if exists "Users read own promo credit transactions" on public.promo_credit_transactions;
create policy "Users read own promo credit transactions"
  on public.promo_credit_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Admins read referral signups" on public.referral_signups;
create policy "Admins read referral signups"
  on public.referral_signups for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins read promo credit transactions" on public.promo_credit_transactions;
create policy "Admins read promo credit transactions"
  on public.promo_credit_transactions for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 僅能由已登入之新註冊者本人觸發，原子發點
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
  v_max constant integer := 1000;
  v_per_signup constant integer := 50;
begin
  if auth.uid() is distinct from p_referred_user_id then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if p_referrer_slug is null or trim(p_referrer_slug) = '' then
    return jsonb_build_object('ok', false, 'reason', 'no_ref');
  end if;

  if not exists (
    select 1 from public.creator_profiles
    where user_id = p_referred_user_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'no_profile');
  end if;

  select cp.user_id into v_referrer_user_id
  from public.creator_profiles cp
  where cp.slug = lower(trim(p_referrer_slug))
    and cp.is_demo = false
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
