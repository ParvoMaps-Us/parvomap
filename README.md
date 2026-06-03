# ParvoMap

**US Canine Disease & Environmental Hazard Outbreak Tracker**

Real-time crowdsourced map tracking canine parvovirus, Lyme disease,
RMSF, kennel cough, blue-green algae, and 14 other threats to dogs
across the United States.

🌐 [parvomap.us](https://parvomap.us)

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
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

## Related

- [Scoopie LLC](https://scoopie.us) — Utah parvo decontamination service
