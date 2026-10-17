-- 客戶在站內按「已修復」才算真正結案

alter table public.bug_reports
  add column if not exists user_confirmed_at timestamptz;

create index if not exists bug_reports_awaiting_confirm_idx
  on public.bug_reports (status, user_confirmed_at)
  where status = 'fixed' and user_confirmed_at is null;

drop policy if exists "Users read own bug reports" on public.bug_reports;
create policy "Users read own bug reports"
  on public.bug_reports for select
  using (
    reporter_id = auth.uid()
    or (
      contact_email is not null
      and exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and lower(profiles.email) = lower(bug_reports.contact_email)
      )
    )
  );

create or replace function public.confirm_own_bug_fixed(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_updated integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', '請先登入');
  end if;

  select email into v_email from public.profiles where id = v_uid;

  update public.bug_reports
  set
    user_confirmed_at = now(),
    updated_at = now()
  where id = p_id
    and status = 'fixed'
    and user_confirmed_at is null
    and (
      reporter_id = v_uid
      or (contact_email is not null and lower(contact_email) = lower(coalesce(v_email, '')))
    );

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return jsonb_build_object('ok', false, 'error', '找不到可確認的回報');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.confirm_own_bug_fixed(uuid) from public;
grant execute on function public.confirm_own_bug_fixed(uuid) to authenticated;
