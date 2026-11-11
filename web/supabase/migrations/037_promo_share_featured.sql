-- 037：宣傳 Vigo 換「首頁＋探索頁精選 14 天」，送出即自動通過（2026-11-11 經營者決定）
-- 接案者貼文附上自己的 Vigo 作品集連結（或邀請連結），把連結交上來就立刻：
--   1. 精選 14 天（featured = true，featured_until = 14 天後；到期由每日排程取消）
--   2. 第一次另外拿 100 折抵點（沿用原規則，上限 300）
-- 精選期間不能再送；到期後可以用新貼文再換一次。
-- 可重跑；不刪任何資料（只拿掉「每人只能有一筆通過」的唯一索引，改由函式控管）。

alter table public.creator_profiles
  add column if not exists featured_until timestamptz;

drop index if exists public.promo_share_submissions_one_approved_per_user;

create or replace function public.claim_promo_share(p_platform text, p_post_url text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.creator_profiles%rowtype;
  v_url text := trim(coalesce(p_post_url, ''));
  v_award integer := 0;
  v_until timestamptz := now() + interval '14 days';
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if p_platform not in ('threads', 'facebook', 'instagram', 'tiktok', 'other') then
    return jsonb_build_object('ok', false, 'reason', 'bad_platform');
  end if;

  if v_url !~* '^https?://[^ ]+$' or length(v_url) > 500 then
    return jsonb_build_object('ok', false, 'reason', 'bad_url');
  end if;

  select * into v_profile
  from public.creator_profiles
  where user_id = v_uid and is_demo = false
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_profile');
  end if;

  if v_profile.featured_until is not null and v_profile.featured_until > now() then
    return jsonb_build_object('ok', false, 'reason', 'still_featured', 'featured_until', v_profile.featured_until);
  end if;

  if exists (select 1 from public.promo_share_submissions where post_url = v_url) then
    return jsonb_build_object('ok', false, 'reason', 'duplicate_url');
  end if;

  -- 折抵點只有第一次給
  if not exists (
    select 1 from public.promo_share_submissions
    where user_id = v_uid and status = 'approved' and credits_awarded > 0
  ) then
    v_award := greatest(0, least(100, 300 - coalesce(v_profile.promo_credits_balance, 0)));
  end if;

  insert into public.promo_share_submissions
    (user_id, platform, post_url, status, credits_awarded, reviewed_at, admin_note)
  values
    (v_uid, p_platform, v_url, 'approved', v_award, now(), '自動通過（精選 14 天）');

  update public.creator_profiles
  set featured = true,
      featured_until = v_until,
      promo_credits_balance = promo_credits_balance + v_award
  where id = v_profile.id;

  if v_award > 0 then
    insert into public.promo_credit_transactions (user_id, amount, reason, related_user_id)
    values (v_uid, v_award, 'social_share', null);
  end if;

  return jsonb_build_object('ok', true, 'credits_awarded', v_award, 'featured_until', v_until);
end;
$$;

revoke all on function public.claim_promo_share(text, text) from public;
grant execute on function public.claim_promo_share(text, text) to authenticated;
