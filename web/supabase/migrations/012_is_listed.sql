-- 創作者可自行下架：帳號保留，但不顯示於探索／公開頁

alter table public.creator_profiles
  add column if not exists is_listed boolean not null default true;

create index if not exists creator_profiles_listed_idx
  on public.creator_profiles (is_listed)
  where verification_status = 'approved';

-- 公開僅能讀取「已審核且已上架」的創作者（本人與管理員除外）
drop policy if exists "Anyone can read approved creators" on public.creator_profiles;
create policy "Anyone can read approved creators"
  on public.creator_profiles for select
  using (
    (verification_status = 'approved' and is_listed = true)
    or auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Anyone can read approved portfolio items" on public.portfolio_items;
create policy "Anyone can read approved portfolio items"
  on public.portfolio_items for select
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = portfolio_items.creator_id and cp.user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
    or (
      status = 'approved'
      and exists (
        select 1 from public.creator_profiles cp
        where cp.id = portfolio_items.creator_id
          and cp.verification_status = 'approved'
          and cp.is_listed = true
      )
    )
  );
