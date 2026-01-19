create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null default 'photos',
  storage_path text not null,
  mime_type text,
  original_name text,
  exif jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  review_text text not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists photos_user_id_idx on public.photos(user_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);
create index if not exists reviews_photo_id_idx on public.reviews(photo_id);

alter table public.photos enable row level security;
alter table public.reviews enable row level security;

create policy "Photos are owner-only" on public.photos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Reviews are owner-only" on public.reviews
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict do nothing;

create policy "Photos bucket read" on storage.objects
  for select
  using (bucket_id = 'photos' and owner_id = auth.uid()::text);

create policy "Photos bucket insert" on storage.objects
  for insert
  with check (bucket_id = 'photos' and owner_id = auth.uid()::text);

create policy "Photos bucket update" on storage.objects
  for update
  using (bucket_id = 'photos' and owner_id = auth.uid()::text)
  with check (bucket_id = 'photos' and owner_id = auth.uid()::text);

create policy "Photos bucket delete" on storage.objects
  for delete
  using (bucket_id = 'photos' and owner_id = auth.uid()::text);
