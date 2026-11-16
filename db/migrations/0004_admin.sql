insert into public.profiles (id, email, full_name, role)
values (
  'cb0af8f9-b490-4a0c-ab94-2a563957c13c',
  'admin@gmail.com',
  'Admin',
  'owner'
)
on conflict (id) do update
set role = 'owner',
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name); 