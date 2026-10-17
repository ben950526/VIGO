-- 客戶按「還有問題」時把回報重新打開

create or replace function public.reopen_own_bug(p_id uuid)
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
    status = 'open',
    user_confirmed_at = null,
    admin_note = nullif(
      trim(
        concat_ws(
          E'\n',
          admin_note,
          to_char(timezone('Asia/Taipei', now()), 'YYYY-MM-DD HH24:MI') || ' 對方按「還有問題」'
        )
      ),
      ''
    ),
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
    return jsonb_build_object('ok', false, 'error', '找不到可回報的項目');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.reopen_own_bug(uuid) from public;
grant execute on function public.reopen_own_bug(uuid) to authenticated;
