-- 若 020 在 referral_signups check 失敗後中斷，先跑本檔再重跑 020 剩餘段落（或整份 020）。

update public.referral_signups
set credits_awarded = least(credits_awarded, 20)
where credits_awarded > 20;

alter table public.referral_signups
  drop constraint if exists referral_signups_credits_awarded_check;

alter table public.referral_signups
  add constraint referral_signups_credits_awarded_check
  check (credits_awarded >= 0 and credits_awarded <= 20);
