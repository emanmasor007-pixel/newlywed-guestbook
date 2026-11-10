# A Little Note for the Newlyweds

A digital wedding guestbook for **Muhammad Muaz Al-Iman bin Mansor & Nik Anis Nabilah binti Nik Ahmad Rosmani** · 19 December 2026.

Guests scan a QR code, then leave a written wish, up to 20 photos (with captions), a voice note (max 90 s) and music memories. Everything lands in a private Supabase backend; the admin gets an email alert for every note and a private dashboard.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS · Framer Motion · Supabase (Postgres, Auth, Storage) · Resend · Vercel

---

## 1. Project structure

```
newlywed-guestbook/
├─ app/
│  ├─ layout.tsx              fonts, background music provider, petals, mute button
│  ├─ template.tsx            page-turn transition between routes
│  ├─ globals.css             paper texture, gold foil, petals, buttons
│  ├─ page.tsx                landing page (bilingual welcome + hero button)
│  ├─ guestbook/page.tsx      4-step guest form
│  ├─ thank-you/page.tsx      celebration screen (confetti)
│  ├─ api/notify/route.ts     sends the email alert via Resend (server only)
│  └─ admin/
│     ├─ login/page.tsx       Supabase Auth sign in (admin email only)
│     └─ dashboard/page.tsx   counters, wish wall, photos, voice, music, QR, settings
├─ components/
│  ├─ MusicProvider.tsx       background audio (autoplay-safe, fades, ducking)
│  ├─ MusicToggle.tsx         floating mute/unmute button with wave animation
│  ├─ Petals.tsx              falling petals + gold sparkles (CSS animated)
│  ├─ Scrap.tsx               Polaroid, tape, pin, sticker, paper card, gold divider
│  ├─ guestbook/              GuestbookForm, WishSection, VoiceSection, PhotoSection, MusicSection
│  └─ admin/QRPanel.tsx       high-res printable QR card
├─ hooks/                     useRecorder (MediaRecorder + visualiser), useHijriDate
├─ lib/                       config, supabase client, submit logic, image compression, utils, types
├─ public/lagu-baru.mp3          background music
├─ public/music/*.wav            4 curated library tracks (original, royalty-free)
└─ supabase/schema.sql        tables + RLS + storage buckets + policies
```

## 2. Setup (about 15 minutes)

### a) Install
```bash
npm install
```
Copy `.env.example` to `.env.local` and replace the placeholders with your project values. Keep `.env.local` private; it is ignored by Git.

### b) Supabase
1. Create a project at supabase.com.
2. **SQL Editor → New query →** paste all of `supabase/schema.sql` → Run. This creates the tables, Row Level Security, the three **private** storage buckets and their policies.
3. Guest entries are stored in `public.submissions`; this app does not use a separate `public.guests` table.
4. Run `supabase/verify-rls.sql` to confirm that RLS is enabled and policies exist for the app's tables. `public.guests` should show `table_exists = false`.
5. **Authentication → Users → Add user:** email `emanmasor007@gmail.com`, a strong password, tick *Auto Confirm User*.
6. **Authentication → Providers → Email:** turn **off** "Allow new users to sign up" so nobody else can create an account.

### c) Environment variables (`.env.local`)

| Variable | Where to get it | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page | public; safe because RLS only allows guest INSERTs |
| `SUPABASE_SERVICE_ROLE_KEY` | same page | **secret, server only.** Never add `NEXT_PUBLIC_` to it |
| `RESEND_API_KEY` | resend.com → API Keys | secret |
| `RESEND_FROM_EMAIL` | your Resend sender | `onboarding@resend.dev` works for testing, but only delivers to the email that owns the Resend account (use that Gmail to sign up, or verify your own domain) |
| `ADMIN_EMAIL` / `NEXT_PUBLIC_ADMIN_EMAIL` | `emanmasor007@gmail.com` | must match the SQL `is_admin()` function and the Auth user |
| `NEXT_PUBLIC_SITE_URL` | your live URL | used for the QR code and email link |
| `NEXT_PUBLIC_HIJRI_DATE` | `10 Rejab 1448 H` | fallback shown when no database setting is available; in Vercel, set this for each deployment environment |

### d) Run
```bash
npm run dev      # http://localhost:3000
```
Sign in at `/admin/login`.

### e) Deploy to Vercel
1. Import the GitHub repository in Vercel and set **Root Directory** to `newlywed-guestbook` (the Next.js app is in this subfolder).
2. Keep the default install and build commands (`npm install` and `npm run build`).
3. Add the variables from the table above in **Project → Settings → Environment Variables**. Use `10 Rejab 1448 H` as the `NEXT_PUBLIC_HIJRI_DATE` value; do not include quotes in Vercel's value field. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never prefix it with `NEXT_PUBLIC_`.
4. Make sure `NEXT_PUBLIC_SITE_URL` is the final domain, then deploy or redeploy. `NEXT_PUBLIC_*` values are embedded at build time.
5. If the landing page shows the database value instead of the environment fallback, run `supabase/update-hijri-date.sql` in Supabase SQL Editor to set `site_settings.hijri_date` to `10 Rejab 1448 H`.
6. Open `/admin/dashboard → QR code` and download or print the card.

## 3. How security works

* **Guests (anon):** can only `INSERT` into the four tables and upload to the three buckets. They cannot read, list, update or delete anything. Column-level grants stop them from setting `notified`.
* **Admin:** only the signed-in user whose email equals the one in `public.is_admin()` can `SELECT`/`DELETE` rows and read/delete files. Photos, voice and music are served through 1-hour signed URLs from private buckets.
* **Service role key:** used only inside `/api/notify` on the server to read the new row and send the email. The `notified` flag is claimed atomically, so repeated calls never send duplicate emails.
* The dashboard's client-side redirect is only for convenience; Row Level Security is the real protection.
* Optional hardening for the event: turn on Vercel's Attack Challenge Mode / WAF rate limiting, or add Cloudflare Turnstile to the form, since the guest endpoints are intentionally open.

## 4. Things to personalise

* **Hijri date:** `NEXT_PUBLIC_HIJRI_DATE` defaults to `10 Rejab 1448 H`; an existing `site_settings.hijri_date` value takes precedence. Edit it in Admin → *Settings* or run `supabase/update-hijri-date.sql`. Please confirm the date against the official Malaysian (JAKIM) calendar before the wedding.
* **Background music:** `components/MusicProvider.tsx` plays `public/lagu-baru.mp3`. Replace that file to change the background track, or update `SRC` in the provider if you use a different filename.
* **Music library:** drop MP3s into `public/music` and edit `lib/musicLibrary.ts`.
* **Wishes templates / stickers / relationship list:** `lib/config.ts`.
* **Colours & fonts:** `tailwind.config.ts`, `app/layout.tsx`.

## 5. Notes & limits

* Browsers block autoplay with sound. The music starts on the guest's first tap, scroll or key press and the floating button shows the state; the choice to mute is remembered.
* Background music fades out automatically while a guest records a voice note or previews a song.
* Photos are resized to max 1600 px / JPEG on the guest's phone. HEIC photos that the browser cannot decode are uploaded as-is, so keep the 8 MB bucket limit in mind.
* Spotify / TikTok / YouTube entries are stored as links (those platforms can't be embedded as audio files); the admin opens them from the Music tab.
* Supabase free tier: 1 GB storage, 50 MB per file. 100 guests × ~10 photos at ~400 KB is roughly 400 MB, so upgrade if you expect more.

## 6. Pre-wedding test checklist

1. Submit a note from your phone (text + photo + voice + a song) and confirm the thank-you screen.
2. Check the email arrives at `emanmasor007@gmail.com`.
3. Sign in at `/admin/login`: counters, wish wall, photo lightbox, voice and music playback, delete.
4. Open the site in a private window and confirm that guests cannot see any data (the dashboard redirects to login).
5. Print the QR card and scan it with two different phones.
