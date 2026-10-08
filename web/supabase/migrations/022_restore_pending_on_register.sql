-- 取消「草稿才能送審」。註冊仍進 pending；重點改為引導補資料，不提高送審門檻。

update public.creator_profiles
set verification_status = 'pending'
where verification_status = 'draft';

alter table public.creator_profiles
  drop constraint if exists creator_profiles_verification_status_check;

alter table public.creator_profiles
  add constraint creator_profiles_verification_status_check
  check (verification_status in ('pending', 'approved', 'rejected'));

alter table public.creator_profiles
  alter column verification_status set default 'pending';
