# Fix: "Could not find the 'category' column of 'groups' in the schema cache"

This error means Supabase's PostgREST schema cache does not see the `category` column on `public.groups`.

## 1. Apply migrations

Ensure all migrations have been run on your Supabase project so `public.groups` has the trip columns:

- `supabase/migrations/20250312000000_groups_trip_fields.sql` adds: `max_members`, **`category`**, `trip_date`, `difficulty`, `meeting_point`
- `supabase/migrations/20250315000000_groups_destination_country.sql` adds: `destination_lat`, `destination_lng`, `country_name`, `country_code`

**Option A – Supabase Dashboard**

1. Open your project → **SQL Editor**.
2. Run the contents of each migration file above (in order) if you haven't already.

**Option B – Supabase CLI**

```bash
npx supabase db push
# or
npx supabase migration up
```

## 2. Reload PostgREST schema cache (required)

**There is no client-side header to bypass the schema cache.** PostgREST validates requests on the server; you must reload the cache in Supabase.

### One-time reload (do this now)

1. Supabase Dashboard → **SQL Editor**.
2. Run:

```sql
NOTIFY pgrst, 'reload schema';
```

3. Wait a few seconds, then retry your request (e.g. create group).

### Auto-reload on future DDL (optional)

Run this once in the SQL Editor so the schema cache reloads whenever you run migrations:

```sql
CREATE OR REPLACE FUNCTION pgrst_watch() RETURNS event_trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

DROP EVENT TRIGGER IF EXISTS pgrst_watch;
CREATE EVENT TRIGGER pgrst_watch
  ON ddl_command_end
  EXECUTE PROCEDURE pgrst_watch();
```

### Other options

- **Restart project:** Pause then resume the project in the Dashboard (restarts PostgREST).
- Check **Settings → API** for a "Reload schema" or "Refresh" button if your plan has it.

## 3. Clear local cache

From the app root (`jovago-app`):

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

## 4. Insert logic

The app inserts into `groups` with **lowercase** column names: `category`, `trip_date`, `difficulty`, `meeting_point`, etc. (see `src/app/actions/groups.ts`). The error is from the **remote** schema cache, not from TypeScript.
