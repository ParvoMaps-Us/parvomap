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
- [x] Filter by state / county / city / disease in the UI (dropdowns + disease chips).
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

### Phase 3 — Disease pages ✅ shipped
- [x] `/diseases` index — all diseases grouped by category with live report counts.
- [x] `/diseases/[slug]` — blurb, symptoms, transmission, prevention, severity, plus
      live stats (all-time / 7d / 30d, top states, recent reports) from verified reports.
- [x] SEO metadata per disease + sitemap entries; "not veterinary advice" disclaimer.

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
- [x] Set `CLINIC_API_KEY` in Vercel to enable the programmatic export endpoint.
- [x] Surface a link to `/clinic` for Pro Clinic subscribers (welcome email + `/account`).
- [x] Admin view of clinic disease-tracking requests (`/dashboard` section).
- [x] Persistent 30-day session cookie for the clinic dashboard (magic link → `/api/clinic/login`).

### Phase 5 — Terms of Service & Privacy Policy
Legal pages are now required: we store PII (emails, report contents, lost-dog
photos), take payments via Stripe, and set an authentication cookie.
Decisions: governing law = **State of Utah, USA**; legal/privacy/deletion
contact = **parvomaps.us@gmail.com**.
- [ ] **Privacy Policy** (`/privacy`) — what we collect (emails, reports, photos,
      approximate location, IP), why, retention, and the cookie we set
      (`clinic_session` — strictly-necessary auth, no tracking). Disclose
      sub-processors: Stripe (payments), Resend (email), OpenAI (image moderation),
      Upstash Redis (storage), Vercel Blob (photos), Vercel (hosting), Photon/
      zippopotam (geocoding). Cover user rights + deletion-request contact.
- [ ] **Terms of Service** (`/terms`) — acceptable use, that reports are
      community-submitted and not veterinary advice, no warranty, subscription
      billing/cancellation terms, liability limits.
- [ ] **Footer links** to `/privacy` and `/terms` site-wide.
- [ ] **Checkout consent** — note agreement to Terms/Privacy on the `/pro` flow.
- [ ] Decide if a cookie banner is needed (likely not — the only cookie is
      strictly-necessary auth, no analytics/ad cookies — but confirm).
- [ ] ⚠️ Have a lawyer review before relying on these — drafts are a starting point,
      not legal advice.

## Backlog (nice-to-have)
- [x] **Photo resizing** before upload — downscale large phone photos (~1200px) to cut storage + speed up.
- [x] **"Use my current location"** GPS button on the report form for a one-tap exact pin (great on mobile).
- [x] **Abuse / moderation** — "🚩 Report this pin" on every popup → flags stored in Redis → `/admin` dashboard (key-gated) to remove or dismiss.
- [x] **Click-to-drop-a-pin** directly on the map as another way to set an exact location.
