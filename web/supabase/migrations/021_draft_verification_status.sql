-- 註冊先當草稿，填齊工作室資料後才進入 pending 審核隊列。作品集不擋送審。

alter table public.creator_profiles
  drop constraint if exists creator_profiles_verification_status_check;

alter table public.creator_profiles
  add constraint creator_profiles_verification_status_check
  check (verification_status in ('draft', 'pending', 'approved', 'rejected'));

alter table public.creator_profiles
  alter column verification_status set default 'draft';

update public.creator_profiles
set verification_status = 'draft'
where coalesce(is_demo, false) = false
  and verification_status = 'pending'
  and (
    coalesce(trim(bio), '') = ''
    or char_length(trim(bio)) < 20
    or coalesce(trim(region), '') = ''
    or coalesce(cardinality(service_types), 0) = 0
    or coalesce(cardinality(style_tags), 0) = 0
    or (
      coalesce(trim(contact_email), '') = ''
      and coalesce(trim(line_id), '') = ''
      and coalesce(trim(phone), '') = ''
    )
  );
