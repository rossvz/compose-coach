# cleanup-old-photos

Deletes photos and storage objects older than 30 days.

## Requires env vars
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## Deploy
```bash
npx supabase functions deploy cleanup-old-photos
```

## Schedule (Supabase Dashboard)
Create a Scheduled Function that runs daily (e.g., 03:00 UTC):
- Function: `cleanup-old-photos`
- Cron: `0 3 * * *`
