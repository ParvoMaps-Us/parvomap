import type { Report } from '@/lib/redis'
import { DISEASE_MAP } from '@/lib/diseases'

/** Demo mode is ON only when CLINIC_DEMO=1. Scope this to Vercel's Preview
 *  environment so production stays fully gated behind real auth + Redis. */
export const CLINIC_DEMO = process.env.CLINIC_DEMO === '1'

/** Email shown in the demo dashboard header when CLINIC_DEMO is on. */
export const DEMO_CLINIC_EMAIL = 'demo-clinic@parvomaps.example'

const DAY = 24 * 60 * 60 * 1000

// A small, plausible region set for the filter dropdowns + bar charts.
const PLACES: { state: string; county: string; city: string }[] = [
  { state: 'UT', county: 'Salt Lake County', city: 'Salt Lake City' },
  { state: 'UT', county: 'Utah County', city: 'Provo' },
  { state: 'CA', county: 'Los Angeles County', city: 'Los Angeles' },
  { state: 'CA', county: 'San Diego County', city: 'San Diego' },
  { state: 'TX', county: 'Travis County', city: 'Austin' },
  { state: 'TX', county: 'Harris County', city: 'Houston' },
  { state: 'AZ', county: 'Maricopa County', city: 'Phoenix' },
  { state: 'CO', county: 'Denver County', city: 'Denver' },
]

const REPORTERS: Report['reporterType'][] = ['individual', 'vet', 'facility', 'news']
const DISEASE_KEYS = Object.keys(DISEASE_MAP)

// Deterministic PRNG (mulberry32) so the demo looks identical on every render.
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let cache: Report[] | null = null

/** Generate ~400 synthetic verified disease reports spread over the last year,
 *  with a gentle upward trend + weekly seasonality so the chart looks alive.
 *  Deterministic and cached for the process lifetime. */
export function demoReports(): Report[] {
  if (cache) return cache
  const rand = rng(20260616)
  const now = Date.now()
  const rows: Report[] = []
  // Parvo/distemper weighted heavier so the "by disease" overlay has a clear lead.
  const weights = DISEASE_KEYS.map((_, i) => (i === 0 ? 5 : i === 1 ? 3 : i < 5 ? 2 : 1))
  const pick = <T,>(arr: T[], w?: number[]): T => {
    if (!w) return arr[Math.floor(rand() * arr.length)]
    const total = w.reduce((s, x) => s + x, 0)
    let r = rand() * total
    for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i] }
    return arr[arr.length - 1]
  }

  for (let day = 364; day >= 0; day--) {
    // Base volume rises toward today; weekends dip slightly.
    const trend = 0.6 + (1 - day / 364) * 1.1
    const weekday = new Date(now - day * DAY).getUTCDay()
    const weekend = weekday === 0 || weekday === 6 ? 0.6 : 1
    const expected = trend * weekend * 1.6
    const n = Math.max(0, Math.round(expected + (rand() - 0.5) * 2))
    for (let k = 0; k < n; k++) {
      const place = pick(PLACES)
      const ts = now - day * DAY - Math.floor(rand() * DAY)
      rows.push({
        id: `demo-${day}-${k}`,
        disease: pick(DISEASE_KEYS, weights),
        zip: '00000',
        state: place.state,
        city: place.city,
        county: place.county,
        timestamp: ts,
        verified: true,
        confidence: 0.9,
        reporterType: pick(REPORTERS),
        verifiedClinic: rand() < 0.25,
        kind: 'disease',
      })
    }
  }
  // A few lost-dog rows so that section isn't empty either.
  for (let i = 0; i < 18; i++) {
    const place = pick(PLACES)
    const owner = rand() < 0.6
    rows.push({
      id: `demo-lost-${i}`,
      disease: '',
      zip: '00000',
      state: place.state,
      city: place.city,
      county: place.county,
      timestamp: now - Math.floor(rand() * 30 * DAY),
      verified: true,
      confidence: 0.9,
      kind: 'lost',
      lostKind: owner ? 'owner' : 'sighting',
      dogName: owner ? ['Bella', 'Max', 'Luna', 'Cooper'][i % 4] : undefined,
    })
  }
  rows.sort((a, b) => b.timestamp - a.timestamp)
  cache = rows
  return rows
}
