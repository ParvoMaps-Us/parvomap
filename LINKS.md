# ParvoMaps — Quick Links

Central place for every link you need to run the site.

## Live site
- **Website (canonical):** https://www.parvomaps.us
- **Apex redirect:** https://parvomaps.us
- **Report a case (anchor):** https://www.parvomaps.us/#report
- **Alerts page:** https://www.parvomaps.us/alerts
- **Pro page:** https://www.parvomaps.us/pro
- **Diseases:** https://www.parvomaps.us/diseases

## Admin
- **Moderation dashboard:** https://www.parvomaps.us/admin?key=YOUR_ADMIN_KEY
  - Replace `YOUR_ADMIN_KEY` with the `ADMIN_KEY` value from Vercel env (kept secret — do not commit it here).
  - Lists flagged pins; Remove takes them off the map + deletes the photo, Dismiss clears the flag.

## Code
- **GitHub repo:** https://github.com/ParvoMaps-Us/parvomap

## Hosting — Vercel
> ParvoMaps is its own project — keep it under the **ParvoMaps** Vercel account, not under any Scoopie team.
- **Dashboard:** https://vercel.com/dashboard
- **Project:** `https://vercel.com/<parvomaps-team>/<project>` — fill in once the ParvoMaps Vercel project is set up.
- Where to set env vars: Vercel → Project → **Settings → Environment Variables**
  - `ADMIN_KEY` — gates the moderation dashboard
  - `CRON_SECRET` — auth for the daily cleanup cron
  - `BLOB_READ_WRITE_TOKEN` — auto-added when a Blob store is connected
- **Blob storage (lost-dog photos):** Vercel → Project → **Storage**
- **Cron jobs:** Vercel → Project → **Settings → Cron Jobs** (`/api/cron/delayed-email`, `/api/cron/cleanup`)

## Data & services (external dashboards)
- **Upstash Redis** (all report/flag data): https://console.upstash.com
- **Resend** (verification + alert emails): https://resend.com/emails
- **Stripe** (Pro/Guardian billing): https://dashboard.stripe.com

## SEO / meta
- **Sitemap:** https://www.parvomaps.us/sitemap.xml
- **Robots:** https://www.parvomaps.us/robots.txt

---
_Tip: keep the real `ADMIN_KEY` out of this file — it's committed to the repo._
