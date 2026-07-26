-- 允許管理員替其他創作者補充作品（供後台使用）

drop policy if exists "Admins insert portfolio items" on public.portfolio_items;

create policy "Admins insert portfolio items"
  on public.portfolio_items for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
