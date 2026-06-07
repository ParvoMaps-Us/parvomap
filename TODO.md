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

### Phase 1 — Backend tracking dashboard ✅
- [x] Internal dashboard UI to track **diseases** and **lost dogs** across the dataset
      (`/dashboard?key=<ADMIN_KEY>`, same gate as `/admin`).
- [x] Surface counts (all-time / 48 h / 7 d / 30 d), breakdowns by disease, state,
      and reporter type, plus a recent-activity table for each report type.
- [ ] Filter by state / county / disease in the UI (currently shows aggregate bars).
- [ ] Tie visibility to subscriber status (Guardian vs Pro Clinic scopes) — for now
      it's ADMIN_KEY-gated internal only.

### Phase 2 — Alerts page ✅
- [x] `/alerts` — subscriber-gated via magic link (email → link only if active in the
      Stripe `subscribers` hash). `/alerts/manage` sets ZIP, radius, diseases, lost dogs.
- [x] Per-ZIP / per-radius preferences stored in Redis `alert_prefs`.
- [x] Email delivery wired into the verify route: when a report publishes, matching
      active subscribers get a `sendAlertNotification` email (excludes the reporter).
- [x] Welcome email on subscribe (Stripe webhook) with directions to set up alerts.
- [x] Unsubscribe link in alert emails → `/alerts/unsubscribe` (HMAC, confirm button).
- [x] Account page `/account` + person icon in header → Stripe Customer Portal
      (manage payment / cancel). Needs the portal enabled once in Stripe settings.
- [ ] Push notifications (web/mobile) — left as a future phase; email-only for now.

### Phase 3 — Disease page
- [ ] Flesh out the per-disease page (`/diseases/[slug]`) with richer data.
- [ ] Regional breakdowns, case history, and links into the dashboard.

### Phase 4 — Pro Clinic data access (the $49/mo perk) — ✅ shipped
The Pro Clinic paid surface, gated to active `pro-clinic` accounts:
- [x] **Clinic dashboard** — `/clinic` requests a magic link; `/clinic/dashboard`
      verifies it + re-checks `isProClinic`, then renders the aggregated view.
- [x] **State / county / city filtering** — region dropdowns + by-county chart on the
      dashboard. County is derived via Photon reverse-geocode at submission and stored
      on the public report (non-PII); filter + CSV column included.
- [x] **Exportable case data (CSV / API)** — Export CSV button + `/api/clinic/export`
      (CSV/JSON), authed by magic token OR `CLINIC_API_KEY` for programmatic pulls.
- [x] **Verified-clinic badge** — reports from active Pro Clinic emails are tagged
      `verifiedClinic` at verify time (no PII stored); badge shows on map + dashboard.
- [x] **Plan-aware gating** — `getActiveSubscriberPlan` / `isProClinic` in `lib/alerts.ts`.

Follow-ups:
- [ ] Set `CLINIC_API_KEY` in Vercel to enable the programmatic export endpoint.
- [ ] Surface a link to `/clinic` for Pro Clinic subscribers (e.g. welcome email / `/account`).
- [ ] Admin view of clinic disease-tracking requests (currently email + Redis only).

## Backlog (nice-to-have)
- [x] **Photo resizing** before upload — downscale large phone photos (~1200px) to cut storage + speed up.
- [x] **"Use my current location"** GPS button on the report form for a one-tap exact pin (great on mobile).
- [x] **Abuse / moderation** — "🚩 Report this pin" on every popup → flags stored in Redis → `/admin` dashboard (key-gated) to remove or dismiss.
- [x] **Click-to-drop-a-pin** directly on the map as another way to set an exact location.
