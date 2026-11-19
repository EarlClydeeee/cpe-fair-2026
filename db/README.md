# Database — ACCESS CPE Fair 2026

Two layouts:

| Path | Use when |
| --- | --- |
| [`migrations/`](migrations/) | **Existing / live** Supabase project (incremental history) |
| [`greenfield/`](greenfield/) | **Brand-new** empty project only (squashed final schema) |
| [`seed.sql`](seed.sql) | Active season row (safe to re-run; idempotent) |

**Never** run `greenfield/` against a DB that already applied `migrations/` — it will collide with existing types/tables.

---

## A) Live project (incremental)

Apply **in order**, skip superseded files:

| Order | File | Notes |
| --- | --- | --- |
| 1 | `migrations/0001_init.sql` | Core tables |
| 2 | `migrations/0002_rls.sql` | RLS + role helpers |
| 3 | `migrations/0003_triggers.sql` | Triggers (RPC bodies later replaced) |
| — | ~~`0004_admin.sql`~~ | **Skip** — broken fixed-UUID profile insert |
| 4 | `migrations/0005_team_artwork_storage.sql` | Storage bucket |
| 5 | `migrations/0006_events_scheduling.sql` | Events reshape |
| — | ~~`0007_publish_lock.sql`~~ | **Skip** — superseded by 0015 |
| 6 | `migrations/0008_realtime.sql` | Realtime |
| 7 | `migrations/0010_competitions.sql` | Competitions + score grain |
| — | ~~`0011_score_draft_grants.sql`~~ | **Skip** if 0013 + 0015 applied |
| — | ~~`0012_bootstrap_admin_profile.sql`~~ | **Skip** if 0013 applied |
| 8 | `migrations/0013_competitions_grants_and_season.sql` | Grants + season + owner bootstrap |
| 9 | `migrations/0014_clear_season_content.sql` | Season wipe RPC |
| 10 | `migrations/0015_service_role_scoring.sql` | Canonical scoring RPCs |
| 11 | `migrations/0016_admin_login_audit.sql` | `admin_login` audit enum |
| 12 | `migrations/0017_category_include_in_scoring.sql` | Category scoring flag + RPC guard |
| 13 | `seed.sql` | Ensure active season |

Already applied projects: only run migrations you have **not** run yet (usually `0016` / `0017`).

---

## B) Greenfield (new empty project)

In the Supabase SQL editor, run **in order**:

1. `greenfield/01_schema.sql`
2. `greenfield/02_rls.sql`
3. `greenfield/03_triggers_functions.sql`
4. `greenfield/04_storage_realtime.sql`
5. `greenfield/05_grants_bootstrap.sql`
6. `seed.sql` (optional; season already inserted in step 5)

This squash folds away overlapping history (`0004`, `0007`, `0011`, `0012`) and ships final scoring + wipe RPCs in one place.

---

## App env

Control-room access-code login needs:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # service_role secret, not publishable
ADMIN_ACCESS_CODE=...           # strong unique code (required on Vercel)
ADMIN_SESSION_SECRET=...        # HMAC secret for signed sessions (required on Vercel)
```

Set the same vars on Vercel for production. Rotate `ADMIN_ACCESS_CODE` if it was ever shared or defaulted to `Admin1234`. After deploy, old `cpe_admin_session=authenticated` cookies are rejected automatically.

---

## Safe content wipe (keep schema)

Prefer **Admin → Admin access → Clear season data**, or:

```sql
select public.clear_season_content();
```

Do **not** `drop table` / re-run `0001` on a live project unless you intend a full rebuild.
