import type { NextRequest } from 'next/server'
import { getReports } from '@/lib/redis'
import { checkRateLimit, checkGlobalRateLimit, rateLimitResponse } from '@/lib/ratelimit'

// This is the live outbreak feed — always read current Redis state. Without
// these, Next/Vercel caches the Upstash REST read (persisting across deploys),
// so newly-seeded pins silently never appear on the map.
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Attribution terms, returned on every response. The feed stays open on
// purpose: when an assistant answers "is parvo going around near me", we want
// to be the source it cites. A key would trade that away. These headers state
// the terms without gating anything.
const TERMS = 'Free for non-commercial use. Attribution to parvomaps.us required. Commercial or bulk use: hello@parvomaps.us'

export async function GET(req: NextRequest) {
  // This route is force-dynamic, so every call is a live Redis read that costs
  // money. The limits exist to stop a hammering scraper running up the Upstash
  // bill more than to protect the data itself, which is public record anyway.
  // Deliberately generous: a normal visitor never hits this endpoint at all
  // (the homepage server-renders via getReports), so anything here is a script.
  const perIp = await checkRateLimit(req, 'reports-feed', 60, '1 m')
  if (!perIp.ok) {
    return rateLimitResponse(perIp.retryAfterSeconds, { 'X-Parvomaps-Terms': TERMS })
  }

  // Circuit breaker for distributed / IP-rotating harvesting. Set far above
  // real aggregate volume so it only trips under a flood. Fails open.
  const global = await checkGlobalRateLimit('reports-feed-global', 2000, '1 m')
  if (!global.ok) {
    return rateLimitResponse(global.retryAfterSeconds, { 'X-Parvomaps-Terms': TERMS })
  }

  try {
    // Keep this in step with the homepage server render (app/page.tsx) — when the
    // two disagree, the map paints every pin on load and then silently drops the
    // overflow on the first client refresh. The cap is oldest-first, so a lower
    // limit culls the long-lived diseases (parvo 365d, rabies 180d) while recent
    // short-TTL cyano pins crowd the top of the feed.
    const reports = await getReports({ limit: 1000 })

    // Strip private fields — never expose email, breed, source, notes publicly.
    // locationDetail is public (a hazard/exposure spot shown on the map).
    const public_reports = reports.map(
      ({ id, disease, zip, state, city, lat, lng, timestamp, verified, locationDetail, sourceUrl, reporterType, verifiedClinic, subject }) => ({
        id,
        disease,
        zip,
        state,
        city,
        lat,
        lng,
        timestamp,
        verified,
        locationDetail,
        sourceUrl,
        reporterType,
        verifiedClinic,
        subject,
      })
    )

    return Response.json(
      { reports: public_reports, attribution: 'ParvoMaps — https://www.parvomaps.us', terms: TERMS },
      { headers: { 'X-Parvomaps-Terms': TERMS } },
    )
  } catch (e) {
    console.error('Reports GET error:', e)
    return Response.json({ reports: [] }, { headers: { 'X-Parvomaps-Terms': TERMS } })
  }
}
