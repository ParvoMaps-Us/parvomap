import { Redis } from '@upstash/redis'

let redis: Redis | null = null

/** Shared Upstash client (auto-deserialization off — see below). Returns null
 *  if Redis isn't configured. The single source of truth for all Redis access. */
export function getRedisClient(): Redis | null {
  if (redis) return redis

  // Support both UPSTASH_REDIS_REST_* (manual) and KV_REST_API_* (Vercel/Upstash integration).
  // Explicitly skip placeholder values set during local dev scaffolding.
  const isReal = (v?: string) => !!v && !v.includes('placeholder')
  const url   = isReal(process.env.UPSTASH_REDIS_REST_URL)   ? process.env.UPSTASH_REDIS_REST_URL   : process.env.KV_REST_API_URL
  const token = isReal(process.env.UPSTASH_REDIS_REST_TOKEN) ? process.env.UPSTASH_REDIS_REST_TOKEN : process.env.KV_REST_API_TOKEN

  if (
    !url || !token ||
    url.includes('placeholder') ||
    token.includes('placeholder')
  ) {
    console.warn('Redis not configured — using null client')
    return null
  }

  try {
    // The SDK auto-parses JSON on read by default. This code stores values with
    // JSON.stringify and reads them with JSON.parse, so leaving auto-parse on
    // means get() returns an object and JSON.parse(object) throws. Disable it so
    // reads return the raw string our JSON.parse expects.
    redis = new Redis({ url, token, automaticDeserialization: false })
    return redis
  } catch (e) {
    console.error('Redis init failed:', e)
    return null
  }
}

/** Public shape stored in the verified sorted set (no PII) */
export interface Report {
  id: string
  disease: string
  zip: string
  state: string
  city?: string
  lat?: number
  lng?: number
  timestamp: number
  verified: boolean
  source?: string
  notes?: string
  confidence: number
  // Specific spot for place-based hazards (e.g. "Utah Lake"). Public, non-PII.
  locationDetail?: string
}

/** Full shape stored in the pending hash (includes PII) */
export interface PendingReport extends Report {
  email?: string | null
  breed?: string | null
  county?: string
  reporterType?: 'individual' | 'vet' | 'facility'
  sighting?: boolean
}

const PENDING_TTL = 60 * 60 * 25 // 25 hours (1 h buffer over the 24 h token TTL)

/** Save a full pending report (with PII) for up to 25 h */
export async function savePendingReport(report: PendingReport): Promise<void> {
  const client = getRedisClient()
  if (!client) throw new Error('Redis not configured')
  await client.set(`reports:pending:${report.id}`, JSON.stringify(report), {
    ex: PENDING_TTL,
  })
}

/** Retrieve a pending report by ID */
export async function getPendingReport(id: string): Promise<PendingReport | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.get<string>(`reports:pending:${id}`)
  if (!raw) return null
  return JSON.parse(raw) as PendingReport
}

/** Delete a pending report (called after successful verification) */
export async function deletePendingReport(id: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.del(`reports:pending:${id}`)
}

/** Move a verified report into the public sorted set (strips PII) */
export async function publishVerifiedReport(report: PendingReport): Promise<void> {
  const client = getRedisClient()
  if (!client) throw new Error('Redis not configured')

  const publicReport: Report = {
    id:         report.id,
    disease:    report.disease,
    zip:        report.zip,
    state:      report.state,
    city:       report.city,
    lat:        report.lat,
    lng:        report.lng,
    timestamp:  report.timestamp,
    verified:   true,
    source:     report.source ?? undefined,
    notes:      report.notes ?? undefined,
    confidence: report.confidence,
    locationDetail: report.locationDetail ?? undefined,
  }

  await client.zadd('reports:verified', {
    score:  report.timestamp,
    member: JSON.stringify(publicReport),
  })
}

/** Queue a delayed outreach email for a Utah reporter (fires ~30 min after submission) */
export async function queueDelayedEmail(reportId: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  const fireAt = Date.now() + 30 * 60 * 1000 // 30 minutes from now
  await client.zadd('delayed-emails:queue', { score: fireAt, member: reportId })
}

const EMPTY_STATS = {
  last30: 0, last7: 0, last48: 0, states: 0,
  topDisease: '', topStates: '',
}

export async function getReports({ limit = 500 }: { limit?: number } = {}): Promise<Report[]> {
  const client = getRedisClient()
  if (!client) return []

  try {
    const raw = await client.zrange('reports:verified', 0, limit - 1, { rev: true })
    return (raw as string[]).map(s => JSON.parse(s) as Report)
  } catch (e) {
    console.error('getReports error:', e)
    return []
  }
}

export async function getStats() {
  const client = getRedisClient()
  if (!client) return EMPTY_STATS

  try {
    const reports = await getReports({ limit: 500 })
    const now = Date.now()
    const recent48 = reports.filter(r => now - r.timestamp < 48 * 60 * 60 * 1000)

    const diseaseCounts: Record<string, number> = {}
    recent48.forEach(r => { diseaseCounts[r.disease] = (diseaseCounts[r.disease] ?? 0) + 1 })
    const topDisease = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

    const stateCounts: Record<string, number> = {}
    recent48.forEach(r => { if (r.state) stateCounts[r.state] = (stateCounts[r.state] ?? 0) + 1 })
    const topStates = Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s)
      .join(', ')

    return {
      last30: reports.filter(r => now - r.timestamp < 30 * 24 * 60 * 60 * 1000).length,
      last7:  reports.filter(r => now - r.timestamp < 7  * 24 * 60 * 60 * 1000).length,
      last48: recent48.length,
      states: new Set(reports.map(r => r.state).filter(Boolean)).size,
      topDisease,
      topStates,
    }
  } catch (e) {
    console.error('getStats error:', e)
    return EMPTY_STATS
  }
}
