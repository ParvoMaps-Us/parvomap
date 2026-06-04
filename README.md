# ParvoMap

**US Canine Disease & Environmental Hazard Outbreak Tracker**

Real-time crowdsourced map tracking canine parvovirus, Lyme disease,
RMSF, kennel cough, blue-green algae, and 14 other threats to dogs
across the United States.

🌐 [parvomaps.us](https://www.parvomaps.us) (apex `parvomaps.us` redirects to `www`)

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Hosting:** Vercel
- **Database:** Upstash Redis (REST)
- **Email:** Resend
- **Payments:** Stripe
- **Map:** Leaflet.js
- **DNS:** Cloudflare

## Local Development

```bash
cp .env.example .env.local
# Fill in .env.local with real values
npm install
npm run dev
```

## Environment Variables

See `.env.example` for all required variables.

## Deployment

Push to `main` → auto-deploys to Vercel.

## Architecture

See `/lib/diseases.ts` for the single source of truth for all
disease configuration.

See `/lib/redis.ts` for all Redis key patterns.

## Scoopie Lead Flow

Utah reports can become BioRest leads for [Scoopie LLC](https://scoopie.us).
Whether a report generates a lead is decided by **who's reporting** — see
`lib/lead.ts` (`getLeadType`):

| Reporter | Lead? | Reporter outreach email | Scoopie notified |
|----------|-------|-------------------------|------------------|
| Individual — own dog affected | **Residential** | ✅ "is your yard safe" (cron, ~30 min) | ✅ on verify |
| Individual — sighting only | none | ❌ | ❌ |
| Veterinarian | none (map data) | ❌ | ❌ |
| Facility (boarding/commercial) | **Commercial** | ❌ (handled manually) | ✅ on verify |

Scoopie is notified by email to `SCOOPIE_ALERT_EMAIL`, labeled
`[RESIDENTIAL]` or `[COMMERCIAL]` in the subject.

### Future idea: write leads directly into Scoopie's CRM

Right now Scoopie leads are delivered by email and entered into the CRM
manually. A future enhancement is to push qualifying leads straight into
Scoopie's system (webhook / API / shared store) tagged with `source=parvomaps`
and the lead type, so they flow into the pipeline automatically. The
`SCOOPIE_REDIS_REST_*` env placeholders were reserved with this cross-write in
mind. Blocked on CRM-side changes — keep email delivery until then.

## Related

- [Scoopie LLC](https://scoopie.us) — Utah parvo decontamination service
