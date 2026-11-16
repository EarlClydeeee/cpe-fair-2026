# Database — ACCESS CPE Fair 2026

| File | Contents |
| --- | --- |
| `migrations/0001_init.sql` | Enums + tables (drops legacy fair schema first) |
| `migrations/0002_rls.sql` | Role helpers + RLS |
| `migrations/0003_triggers.sql` | Profile trigger, draft/publish RPCs |
| `migrations/0005_team_artwork_storage.sql` | Public `team-artwork` storage bucket + policies |
| `seed.sql` | Season, 6 categories, 8 teams, scores, draft, events |

## Apply

Run migrations in order, then seed, in the Supabase SQL editor — or copy into `supabase/migrations/` and `supabase db push`.

## First owner

Sign up at `/login` after creating an auth user, then:

```sql
update public.profiles set role = 'owner' where email = 'you@example.com';
```

Or insert a pending invitation before signup so `handle_new_user` assigns the role automatically.
