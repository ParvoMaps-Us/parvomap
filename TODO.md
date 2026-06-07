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

## Pro feature roadmap (gated on active subscription)
The `/pro` checkout is live and subscribers are recorded in the Redis `subscribers`
hash. These phases build the value subscribers are paying for.

### Phase 1 — Backend tracking dashboard
- [ ] Internal dashboard UI to track **diseases** and **lost dogs** across the dataset.
- [ ] Surface counts, trends, and recent activity for both report types.
- [ ] Filter by state / county / disease; spot clusters at a glance.
- [ ] Tie visibility to subscriber status (Guardian vs Pro Clinic scopes).

### Phase 2 — Alerts page
- [ ] Build out `/alerts` so subscribers get real-time outbreak + lost-dog alerts.
- [ ] Per-ZIP / per-region subscription preferences.
- [ ] Email + push delivery wired to the `subscribers` records.

### Phase 3 — Disease page
- [ ] Flesh out the per-disease page (`/diseases/[slug]`) with richer data.
- [ ] Regional breakdowns, case history, and links into the dashboard.

## Backlog (nice-to-have)
- [x] **Photo resizing** before upload — downscale large phone photos (~1200px) to cut storage + speed up.
- [x] **"Use my current location"** GPS button on the report form for a one-tap exact pin (great on mobile).
- [x] **Abuse / moderation** — "🚩 Report this pin" on every popup → flags stored in Redis → `/admin` dashboard (key-gated) to remove or dismiss.
- [x] **Click-to-drop-a-pin** directly on the map as another way to set an exact location.
