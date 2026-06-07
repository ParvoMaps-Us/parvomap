# ParvoMaps — TODO

A running list of ideas and work to build out. Newest ideas can go under "Backlog".

## Production setup (do before relying on new features)
- [ ] Connect a **Vercel Blob store** so `BLOB_READ_WRITE_TOKEN` exists — lost-dog photo uploads are disabled without it.
- [ ] Confirm **`CRON_SECRET`** is set in Vercel so the daily retention cleanup cron runs authenticated.
- [ ] Set **`ADMIN_KEY`** (long random string) in Vercel — gates the `/admin` moderation dashboard and its remove/dismiss actions. Visit `/admin?key=<ADMIN_KEY>`.

## Polish
- [x] Email wordmark: render "ParvoMaps" instead of "PARVOMAP".
- [x] `?removed=success` confirmation banner after an owner marks a lost dog as found.
- [x] Map legend: explain the 🐶 lost-dog marker.

## Backlog (nice-to-have)
- [x] **Photo resizing** before upload — downscale large phone photos (~1200px) to cut storage + speed up.
- [x] **"Use my current location"** GPS button on the report form for a one-tap exact pin (great on mobile).
- [x] **Abuse / moderation** — "🚩 Report this pin" on every popup → flags stored in Redis → `/admin` dashboard (key-gated) to remove or dismiss.
- [x] **Click-to-drop-a-pin** directly on the map as another way to set an exact location.
