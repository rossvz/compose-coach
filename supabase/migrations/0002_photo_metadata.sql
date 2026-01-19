alter table public.photos
  add column if not exists file_size integer,
  add column if not exists width integer,
  add column if not exists height integer;
