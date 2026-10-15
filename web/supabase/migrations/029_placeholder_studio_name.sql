-- 舊帳把「無／F」當工作室名：有實名就改成實名，讓後台比較好認
update public.creator_profiles cp
set studio_name = trim(p.real_name)
from public.profiles p
where p.id = cp.user_id
  and coalesce(cp.is_demo, false) = false
  and trim(cp.studio_name) in (
    '無', '没有', '沒有', '無名稱', '未命名', '尚未命名',
    'F', 'f', 'N/A', 'n/a', 'none', 'test', '-', '—'
  )
  and coalesce(trim(p.real_name), '') <> ''
  and trim(p.real_name) <> trim(cp.studio_name);
