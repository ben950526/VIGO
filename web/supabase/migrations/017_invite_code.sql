-- 每位接案者專屬邀請碼（註冊時自動產生，與 slug 無關）

alter table public.creator_profiles
  add column if not exists invite_code text;

create unique index if not exists creator_profiles_invite_code_idx
  on public.creator_profiles (invite_code)
  where invite_code is not null;

-- 既有帳號補碼
do $$
declare
  r record;
  candidate text;
begin
  for r in select id from public.creator_profiles where invite_code is null loop
    loop
      candidate := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      exit when not exists (
        select 1 from public.creator_profiles where invite_code = candidate
      );
    end loop;
    update public.creator_profiles set invite_code = candidate where id = r.id;
  end loop;
end $$;

alter table public.creator_profiles
  alter column invite_code set not null;

create or replace function public.set_creator_invite_code()
returns trigger
language plpgsql
as $$
declare
  candidate text;
begin
  if new.invite_code is not null and trim(new.invite_code) <> '' then
    new.invite_code := upper(trim(new.invite_code));
    return new;
  end if;

  loop
    candidate := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.creator_profiles where invite_code = candidate
    );
  end loop;

  new.invite_code := candidate;
  return new;
end;
$$;

drop trigger if exists creator_profiles_invite_code on public.creator_profiles;
create trigger creator_profiles_invite_code
  before insert on public.creator_profiles
  for each row execute function public.set_creator_invite_code();

-- 推薦歸因：邀請碼或舊版 slug 皆可
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
  v_max constant integer := 1000;
  v_per_signup constant integer := 50;
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
