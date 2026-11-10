-- =====================================================================
--  A LITTLE NOTE FOR THE NEWLYWEDS  -  Supabase setup
--  Run this whole file once in: Supabase Dashboard > SQL Editor > New query
--  Safe to re-run.
--
--  Security model
--    * Guests (anon role)  : INSERT only. They can never read, update or delete.
--    * Admin (one email)   : SELECT + DELETE everything (plus edit site settings).
--    * Service role (server): used only by /api/notify to send the email alert.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Admin check (change the email here if the admin account changes)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = lower('emanmasor007@gmail.com');
$$;

-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------
create table if not exists public.submissions (
  id            uuid primary key,
  guest_name    text not null check (char_length(btrim(guest_name)) between 1 and 100),
  relationship  text check (relationship is null or char_length(relationship) <= 60),
  message       text check (message is null or char_length(message) <= 1000),
  sticker       text check (sticker is null or char_length(sticker) <= 16),
  notified      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.music_tracks (
  id               uuid primary key,
  submission_id    uuid not null references public.submissions(id) on delete cascade,
  source           text not null check (source in ('library', 'upload', 'link')),
  title            text check (title is null or char_length(title) <= 150),
  artist           text check (artist is null or char_length(artist) <= 150),
  url              text check (url is null or char_length(url) <= 500),
  storage_path     text,
  library_track_id text,
  created_at       timestamptz not null default now()
);

create table if not exists public.photos (
  id              uuid primary key,
  submission_id   uuid not null references public.submissions(id) on delete cascade,
  storage_path    text not null,
  caption         text check (caption is null or char_length(caption) <= 200),
  music_track_id  uuid references public.music_tracks(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table if not exists public.voice_messages (
  id                uuid primary key,
  submission_id     uuid not null references public.submissions(id) on delete cascade,
  storage_path      text not null,
  duration_seconds  integer check (duration_seconds is null or duration_seconds between 0 and 120),
  mime_type         text,
  created_at        timestamptz not null default now()
);

create table if not exists public.site_settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

create index if not exists idx_photos_submission  on public.photos(submission_id);
create index if not exists idx_voice_submission   on public.voice_messages(submission_id);
create index if not exists idx_music_submission   on public.music_tracks(submission_id);
create index if not exists idx_submissions_created on public.submissions(created_at desc);

-- Hijri date shown on the landing page. EDIT IT in Admin > Settings after
-- verifying it against the official Malaysian Hijri calendar (JAKIM).
insert into public.site_settings (key, value)
values ('hijri_date', '9 Rajab 1448 H')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 3. Privileges (column-level for guests so they cannot set `notified`)
-- ---------------------------------------------------------------------
revoke all on public.submissions, public.music_tracks, public.photos,
              public.voice_messages, public.site_settings
  from anon, authenticated;

grant insert (id, guest_name, relationship, message, sticker)
  on public.submissions to anon, authenticated;
grant insert (id, submission_id, source, title, artist, url, storage_path, library_track_id)
  on public.music_tracks to anon, authenticated;
grant insert (id, submission_id, storage_path, caption, music_track_id)
  on public.photos to anon, authenticated;
grant insert (id, submission_id, storage_path, duration_seconds, mime_type)
  on public.voice_messages to anon, authenticated;

grant select, delete on public.submissions, public.music_tracks,
                        public.photos, public.voice_messages to authenticated;

grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

-- ---------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------
alter table public.submissions    enable row level security;
alter table public.music_tracks   enable row level security;
alter table public.photos         enable row level security;
alter table public.voice_messages enable row level security;
alter table public.site_settings  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['submissions','music_tracks','photos','voice_messages'] loop
    execute format('drop policy if exists "guests insert" on public.%I', t);
    execute format('drop policy if exists "admin select"  on public.%I', t);
    execute format('drop policy if exists "admin delete"  on public.%I', t);

    execute format($f$create policy "guests insert" on public.%I
                      for insert to anon, authenticated with check (true)$f$, t);
    execute format($f$create policy "admin select" on public.%I
                      for select to authenticated using (public.is_admin())$f$, t);
    execute format($f$create policy "admin delete" on public.%I
                      for delete to authenticated using (public.is_admin())$f$, t);
  end loop;
end $$;

drop policy if exists "public read hijri"  on public.site_settings;
drop policy if exists "admin write settings" on public.site_settings;
create policy "public read hijri" on public.site_settings
  for select to anon, authenticated using (key = 'hijri_date');
create policy "admin write settings" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. Storage buckets (all PRIVATE)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('guest-photos', 'guest-photos', false,  8388608, array['image/*']),
  ('guest-voice',  'guest-voice',  false, 10485760, array['audio/*']),
  ('guest-music',  'guest-music',  false, 20971520, array['audio/*'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "guestbook guests upload" on storage.objects;
drop policy if exists "guestbook admin read"    on storage.objects;
drop policy if exists "guestbook admin delete"  on storage.objects;

create policy "guestbook guests upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id in ('guest-photos', 'guest-voice', 'guest-music'));

create policy "guestbook admin read" on storage.objects
  for select to authenticated
  using (bucket_id in ('guest-photos', 'guest-voice', 'guest-music') and public.is_admin());

create policy "guestbook admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('guest-photos', 'guest-voice', 'guest-music') and public.is_admin());

-- =====================================================================
-- AFTER RUNNING:  Authentication > Users > Add user
--   email: emanmasor007@gmail.com   + a strong password   (tick "Auto Confirm")
--   Then Authentication > Providers > Email: DISABLE "Allow new users to sign up"
-- =====================================================================
