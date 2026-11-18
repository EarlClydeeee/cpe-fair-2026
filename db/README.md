# Database — ACCESS CPE Fair 2026

| File | Contents |
| --- | --- |
| `migrations/0001_init.sql` | Enums + tables (drops legacy fair schema first) |
| `migrations/0002_rls.sql` | Role helpers + RLS |
| `migrations/0003_triggers.sql` | Profile trigger, draft/publish RPCs |
| `migrations/0005_team_artwork_storage.sql` | Public `team-artwork` storage bucket + policies |
| `migrations/0008_realtime.sql` | Realtime publication for live page updates |
| `migrations/0010_competitions.sql` | Competitions table; scores/events keyed by `competition_id` |
| `migrations/0014_clear_season_content.sql` | RPC to wipe fair content (keeps schema / seasons / profiles) |
| `seed.sql` | Active season only — categories/competitions/scores/events via admin |

## Apply

Run migrations in order, then seed, in the Supabase SQL editor — or copy into `supabase/migrations/` and `supabase db push`.

## First owner

Create an Auth user with email `admin@gmail.com` (or set `ADMIN_LOGIN_EMAIL`), then apply `migrations/0004_admin.sql` so the profile is `owner`. Login uses access code only; the server supplies that email automatically.

```sql
update public.profiles set role = 'owner' where email = 'admin@gmail.com';
```

Or insert a pending invitation before signup so `handle_new_user` assigns the role automatically.
