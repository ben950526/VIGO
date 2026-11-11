-- 036：取消人工審核（2026-11-11 經營者決定）
-- 新工作室、新作品、改過連結的作品，一寫進資料庫就自動變成「已通過」。
-- 用觸發器做，所以不管從哪個註冊入口（Email、Google、前端直接寫入）都一樣生效。
-- 「已退回」的不會自動變回通過；只把「待審」改成「已通過」。
-- 可重跑。

create or replace function public.auto_approve_creator_profile()
returns trigger
language plpgsql
as $$
begin
  if new.verification_status = 'pending' then
    new.verification_status := 'approved';
    if tg_op = 'INSERT' then
      new.is_listed := true;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists creator_profiles_auto_approve on public.creator_profiles;
create trigger creator_profiles_auto_approve
  before insert or update of verification_status on public.creator_profiles
  for each row execute function public.auto_approve_creator_profile();

create or replace function public.auto_approve_portfolio_item()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'pending' then
    new.status := 'approved';
  end if;
  return new;
end;
$$;

drop trigger if exists portfolio_items_auto_approve on public.portfolio_items;
create trigger portfolio_items_auto_approve
  before insert or update of status on public.portfolio_items
  for each row execute function public.auto_approve_portfolio_item();

-- 目前還在佇列裡等審的，一次全部通過
update public.creator_profiles
set verification_status = 'approved', is_listed = true
where verification_status = 'pending';

update public.portfolio_items
set status = 'approved'
where status = 'pending';
