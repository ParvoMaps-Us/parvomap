# Security Review — ParvoMaps backend

A record of the backend security audit and the fixes applied, kept for future
reference. Update the **Status** column and add new rows when findings are
re-reviewed or new ones surface.

- **Date:** 2026-07-04
- **Scope:** All 28 `app/api/**/route.ts` handlers, `middleware.ts`, and the
  server-side `lib/*` they depend on (auth/session, magic links, rate limiting,
  Stripe, notifications, uploads, cron). Plus `npm audit` for dependencies.
- **Method:** Manual read of every route + auth lib, cross-referenced against the
  CSP in `middleware.ts`. Dependency scan via `npm audit`.

---

## Findings & status

Severity reflects real-world exploitability *in this app* (e.g. a finding is
downgraded if the CSP already neutralizes it).

| # | Sev | Finding | Location | Status |
|---|-----|---------|----------|--------|
| 1 | HIGH | Magic-link URLs built from the client-controlled `Origin` header → a spoofed origin emails the real victim a valid link pointing at an attacker host, exfiltrating the token on click (session/account takeover; clinic variant grants case-data export) | `app/api/{clinic,alerts,admin}/request-link/route.ts` | ✅ Fixed |
| 2 | HIGH | Billing portal opened for any typed email → anyone could open a subscriber's Stripe portal (IDOR) | `app/api/portal/route.ts` | ✅ Fixed |
| 3 | MED | Login magic links were replayable (stateless HMAC, no consumption record) for the whole TTL | `lib/magic-link.ts`, `app/api/{clinic,admin}/login/route.ts` | ✅ Fixed |
| 4 | MED | User-supplied `dogName` / `locationDetail` interpolated unescaped into verification/confirmation **email bodies** (HTML/phishing injection, sent to attacker-chosen recipients) | `lib/notifications.ts` | ✅ Fixed |
| 5 | MED | Homepage server component serialized internal moderation fields (`country`, `notes`, `source`) into the public client payload — the `/api/reports` feed strips them, this path didn't | `app/page.tsx`, `lib/redis.ts` | ✅ Fixed |
| 6 | MED | Portal `404` vs `200` leaked whether an email was a subscriber (enumeration oracle) | `app/api/portal/route.ts` | ✅ Fixed (folded into #2) |
| 7 | MOD | `undici` transitive CVE (`< 6.27.0`) | `package-lock.json` | ✅ Fixed (`npm audit fix`) |
| 10 | LOW | `CLINIC_API_KEY` compared with `===` instead of constant-time | `app/api/clinic/export/route.ts` | ✅ Fixed |
| — | — | Checkout endpoint rate limit loose (10/min/IP, no global cap) — card-testing / session-spam surface | `app/api/checkout/route.ts`, `lib/ratelimit.ts` | ✅ Hardened |
| 8 | LOW | Admin state-changing actions on `GET` + `SameSite=Lax` (mild CSRF surface) | `app/api/admin/{remove,dismiss}/route.ts` | ⬜ Open |
| 9 | LOW | `/api/report` accepts arbitrary `photoUrl` (bypasses `/api/upload` moderation) — **CSP `img-src` blocks rendering of non-allowlisted hosts**, so impact is a broken image, not a beacon/gore render | `app/api/report/route.ts`, `lib/report-schema.ts` | ⬜ Open (CSP-mitigated) |
| 11 | LOW | Rate limiter fails open and keys on `x-forwarded-for[0]` (fine behind Vercel's proxy; every throttle disappears if Upstash is down) | `lib/ratelimit.ts` | ⬜ Accepted (availability trade-off) |
| 12 | LOW | `/api/upload` trusts client `file.type`, no magic-byte check (not exploitable for stored XSS — Blob forces an image content-type, filenames are server UUIDs) | `app/api/upload/route.ts` | ⬜ Open |

---

## How the fixes work (for future maintainers)

- **#1 — trusted host, not `Origin`.** Public request-link routes (clinic, alerts)
  now build the emailed link from the canonical host `https://www.parvomaps.us`
  in production (dev still uses the request origin for localhost). The admin route
  uses `req.nextUrl.origin` (Host-derived, constrained by Vercel routing) because
  the admin surface lives on the deployment host, which is blocked on the public
  domain by `middleware.ts`.
- **#2 / #6 — email the portal link.** `/api/portal` no longer returns the Stripe
  portal URL. It verifies the email owns a subscription, then **emails** the link
  (`sendBillingPortalLink` in `lib/notifications.ts`), and always responds with an
  identical generic message. Ownership is proven by receiving the email; the
  response reveals nothing about subscription status. `PortalForm.tsx` shows a
  "check your email" confirmation.
- **#3 — prefetch-safe single-use login links.** `GET` on the login routes now
  renders a "Continue →" interstitial and does **not** consume the token or set a
  cookie — so a mail-scanner/link-safety prefetch (which only issues GETs, never
  submits the form) can't burn the link or mint a session. The `POST` a human
  click triggers atomically burns the token via `consumeMagicToken`
  (`lib/magic-consume.ts`, Redis `SET … NX` keyed on `sha256(token)`) before
  minting the session. The alerts magic link is intentionally **not** single-use —
  it's a working credential for the settings page, not a one-shot login.
- **#4 — escape email bodies.** `esc()` now wraps `subjectThing` / `areaLabel` in
  the verification and confirmation email HTML (the internal/alert emails were
  already escaped — they were the reference).
- **#5 — `toPublicReport`.** New helper in `lib/redis.ts` strips
  `country`/`notes`/`source`; the homepage maps every report through it before
  passing to client components. Admin/clinic dashboards are auth-gated, so they
  keep the full object.
- **#10 — constant-time key.** `CLINIC_API_KEY` compare now hashes both sides and
  uses `timingSafeEqual`, matching `checkAdminPassword`.
- **Checkout hardening.** Tighter per-IP limit plus a global velocity cap
  (circuit breaker) so an IP-rotating attack still trips a site-wide 429.

---

## What held up (verified solid — don't "re-fix")

- All stateless tokens (magic-link, lost-token, admin/clinic sessions, unsub) use
  HMAC-SHA256 + `timingSafeEqual` with length pre-checks. `lib/secret.ts` **fails
  closed in production** (throws if no signing secret) rather than using a
  guessable default.
- Session cookies are `httpOnly`, `secure` in prod, `sameSite=lax`, path-scoped,
  capped TTL. The admin allowlist is re-checked on every request, so removing an
  email revokes live sessions.
- Stripe webhook verifies the raw-body signature before parsing. Checkout uses
  server-side price IDs (client only names a plan key).
- No user-controlled `fetch` targets (no SSRF): geocoding interpolates a
  `^\d{5}$`-validated ZIP; reverse-geocode takes numeric lat/lng; moderation posts
  to a fixed OpenAI host.
- Redis access is parameterized (Upstash SDK); keys are UUIDs, values are
  `JSON.stringify`'d. `disease` is allowlisted at ingest.
- CSP: per-request nonce + `strict-dynamic`, no `unsafe-inline`/`unsafe-eval` in
  `script-src` (prod). `img-src`/`connect-src` are host-allowlisted — this is what
  neutralizes #9.
- `/api/lost/remove` requires an HMAC token bound to the (unguessable UUID)
  report id — no IDOR.
- NOTE: the "legacy `?key=`" comments in the admin remove/dismiss routes are
  **stale** — no such query-param bypass exists in the code.

---

## Action items NOT in code (owner: site operator)

1. **Stripe Radar (the actual fraud-freeze defense).** In the Stripe Dashboard:
   - Radar → Rules: block if `:risk_level:` = `highest`; request 3D Secure if
     `elevated`; add a velocity/IP rate-limit rule.
   - Settings → Radar: confirm card-testing protection is on.
   - Enable elevated-fraud email alerts.
   Rate-limiting our own `/api/checkout` only caps session creation — the decline
   volume Stripe reacts to happens on the hosted page, which Radar governs.
2. **Prefer a dedicated `VERIFICATION_SECRET`** over falling back to `CRON_SECRET`
   for the HMAC signing key (`lib/secret.ts`).

## Smoke tests after deploying auth changes

Reaching these flows needs real Redis + Stripe + Resend, so verify in the deployed
environment:

1. A clinic/alerts magic link still logs in (click link → "Continue" page → signed
   in). Then click the **same** link again → rejected as expired (single-use works).
2. The billing-portal email arrives and its link opens the Stripe portal.
3. The map still renders with `country`/`notes` absent from page source.
