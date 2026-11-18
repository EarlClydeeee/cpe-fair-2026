-- Ensure the hardcoded admin login email has an owner profile after DB resets.
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', 'Admin'),
  'owner'::public.admin_role
from auth.users u
where lower(u.email) = lower('admin@gmail.com')
on conflict (id) do update
set
  role = 'owner',
  email = excluded.email,
  full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);
