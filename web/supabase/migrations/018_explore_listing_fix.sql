-- 探索頁可見性：is_listed 為 NULL 時與後台「已上架」顯示對齊；示範帳號強制可探索

update public.creator_profiles
set is_listed = true
where is_listed is null;

update public.creator_profiles
set is_listed = true
where is_demo = true
  and verification_status = 'approved'
  and is_listed = false;

alter table public.creator_profiles
  alter column is_listed set default true;

-- RLS：已審核且未下架（NULL 視同上架）
drop policy if exists "Anyone can read approved creators" on public.creator_profiles;
create policy "Anyone can read approved creators"
  on public.creator_profiles for select
  using (
    (
      verification_status = 'approved'
      and coalesce(is_listed, true) = true
    )
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
          and coalesce(cp.is_listed, true) = true
      )
    )
  );
