# ParvoMaps — Quick Links

Central place for every link you need to run the site.

## Live site
- **Website (canonical):** https://www.parvomaps.us
- **Apex redirect:** https://parvomaps.us
- **Report a case (anchor):** https://www.parvomaps.us/#report
- **Alerts page:** https://www.parvomaps.us/alerts
- **Pro page:** https://www.parvomaps.us/pro
- **Diseases:** https://www.parvomaps.us/diseases
- **Account / billing (Stripe portal):** https://www.parvomaps.us/account
- **Manage alerts:** https://www.parvomaps.us/alerts
- **Pro Clinic dashboard:** https://www.parvomaps.us/clinic (Pro Clinic subscribers — magic-link gated)
  - Export API: `GET /api/clinic/export?format=csv|json&state=&city=&disease=` — auth via Pro Clinic magic-link or `?key=CLINIC_API_KEY`

## Admin
> Admin lives on the **Vercel host only** — it 404s on parvomaps.us / www by design (kept off the public, indexed domain). The old `?key=` URLs were removed in the June 2026 security audit.
- **Sign in:** https://parvomap.vercel.app/admin/login
- **Tracking dashboard:** https://parvomap.vercel.app/dashboard
  - Disease + lost-dog counts/trends, breakdowns by disease/state/reporter, recent activity,
    **and** the flagged-reports moderation queue (Remove / Dismiss) — one place for everything.
- **Moderation only:** https://parvomap.vercel.app/admin
  - Same flag queue without the analytics. Remove takes a pin off the map + deletes the photo; Dismiss clears the flag.
- **Auth:** email + password → a 15-min magic link is emailed → 7-day cookie session (set on the Vercel host). Your email must be in `ADMIN_EMAILS` and match `ADMIN_PASSWORD` (both in Vercel env — never commit them here).

## Code
- **GitHub repo:** https://github.com/ParvoMaps-Us/parvomap

## Hosting — Vercel
> ParvoMaps is its own project — keep it under the **ParvoMaps** Vercel account, not under any Scoopie team.
- **Dashboard:** https://vercel.com/dashboard
- **Project:** `https://vercel.com/<parvomaps-team>/<project>` — fill in once the ParvoMaps Vercel project is set up.
- Where to set env vars: Vercel → Project → **Settings → Environment Variables**
  - `ADMIN_EMAILS` + `ADMIN_PASSWORD` — gate the admin sign-in (email allowlist + password → magic link)
  - `CRON_SECRET` — auth for the cron jobs (backup, cleanup, delayed-email, recall-alerts)
  - `BLOB_READ_WRITE_TOKEN` — auto-added when a Blob store is connected
  - `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` — daily off-site backups to Cloudflare R2
- **Blob storage (lost-dog photos):** Vercel → Project → **Storage**
- **Cron jobs:** Vercel → Project → **Settings → Cron Jobs** (`/api/cron/delayed-email`, `/api/cron/cleanup`)

## Data & services (external dashboards)
- **Upstash Redis** (all report/flag data): https://console.upstash.com
- **Resend** (verification + alert emails): https://resend.com/emails
- **Stripe** (Pro/Guardian billing): https://dashboard.stripe.com
- **OpenAI** (image moderation for photo uploads): https://platform.openai.com/api-keys
  - Free omni-moderation endpoint screens lost-dog photos for NSFW/gore. Key → Vercel env `OPENAI_API_KEY`.

## SEO / meta
- **Sitemap:** https://www.parvomaps.us/sitemap.xml
- **Robots:** https://www.parvomaps.us/robots.txt

---
_Tip: keep the real `ADMIN_KEY` out of this file — it's committed to the repo._
