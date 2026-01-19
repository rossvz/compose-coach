alter table public.photos
  add column if not exists thumbnail_path text,
  add column if not exists thumbnail_mime_type text;
