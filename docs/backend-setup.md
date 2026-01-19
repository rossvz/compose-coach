# Backend Setup (Supabase)

## 1) Create Supabase project
- Create a new project in Supabase.
- Copy the project URL and anon key.

## 2) Configure environment
Add to `.env` (see `.env.example`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 3) Apply database schema + storage policies (Supabase CLI)
Install + init already done. To push migrations:
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Notes:
- `YOUR_PROJECT_REF` is the project ref from the Supabase dashboard URL.
- If you can’t log in via browser, set `SUPABASE_ACCESS_TOKEN` env var and retry.
- Re-run `npx supabase db push` whenever new migration files are added.
  - New migration: `supabase/migrations/0003_review_title.sql`

Alternatively, you can still paste `supabase/migrations/0001_init.sql` into the SQL editor.

## 4) Enable email/password auth
In Supabase Auth settings:
- Enable Email/Password sign-in.
- Disable email confirmations for local testing (optional).

## 5) Storage bucket
The SQL migration creates the `photos` bucket and RLS policies.

## 6) Verify
- Sign up in the app.
- Upload a photo.
- Confirm storage object and DB rows are created.
