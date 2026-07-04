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
  // County name (e.g. "Salt Lake County"). Public, non-PII — powers the Pro
  // Clinic county filter. Derived via reverse geocoding at submission.
  county?: string
  lat?: number
  lng?: number
  timestamp: number
  verified: boolean
  source?: string
  notes?: string
  confidence: number
  // Specific spot for place-based hazards (e.g. "Utah Lake"). Public, non-PII.
  locationDetail?: string
  // Source article link for news/media reports. Public, non-PII.
  sourceUrl?: string
  // Source category (drives map icon + credibility). Public, non-PII.
  reporterType?: 'individual' | 'vet' | 'facility' | 'news'
  // True when the reporter's email belongs to an active Pro Clinic account.
  // Computed at verify time (PII never stored). Drives the "✓ clinic" badge.
  verifiedClinic?: boolean
  // ISO country code of the submitting IP (from Vercel's edge geo header).
  // Internal MODERATION signal only — deliberately excluded from the public
  // /api/reports feed. Coarse (country-level), set at submission time.
  country?: string

  // ─── Lost-dog reports ───
  // Distinguishes a lost-dog report from a disease/hazard one.
  kind?: 'disease' | 'lost'
  // 'owner' = my dog is lost; 'sighting' = I spotted a loose/lost dog.
  lostKind?: 'owner' | 'sighting'
  dogName?: string
  dogBreed?: string
  dogDescription?: string
  // Exact street address (public for lost dogs — no privacy masking).
  address?: string
  // When the dog was last seen (ISO string).
  lastSeen?: string
  // Public contact (phone/email) shown on the map popup so finders can reach out.
  contact?: string
  // Public photo URL of the dog (Vercel Blob).
  photoUrl?: string
}

/** Full shape stored in the pending hash (includes PII) */
export interface PendingReport extends Report {
  email?: string | null
  breed?: string | null
  county?: string
  reporterType?: 'individual' | 'vet' | 'facility' | 'news'
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
    county:     report.county ?? undefined,
    lat:        report.lat,
    lng:        report.lng,
    timestamp:  report.timestamp,
    verified:   true,
    source:     report.source ?? undefined,
    notes:      report.notes ?? undefined,
    confidence: report.confidence,
    locationDetail: report.locationDetail ?? undefined,
    sourceUrl: report.sourceUrl ?? undefined,
    reporterType: report.reporterType ?? undefined,
    verifiedClinic: report.verifiedClinic ?? undefined,
    country: report.country ?? undefined,
    kind: report.kind ?? undefined,
    lostKind: report.lostKind ?? undefined,
    dogName: report.dogName ?? undefined,
    dogBreed: report.dogBreed ?? undefined,
    dogDescription: report.dogDescription ?? undefined,
    address: report.address ?? undefined,
    lastSeen: report.lastSeen ?? undefined,
    contact: report.contact ?? undefined,
    photoUrl: report.photoUrl ?? undefined,
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

/** Strip internal-only moderation fields from a verified report before it is
 *  exposed to the public web. `country` (submitter-IP geolocation), `notes`, and
 *  `source` are moderation signals, not public data — the /api/reports feed omits
 *  them, and so must any server component that serializes reports into the client
 *  payload (every prop handed to a Client Component ships to the browser). The
 *  map + ticker never read these fields. */
export function toPublicReport(r: Report): Report {
  const pub = { ...r }
  delete pub.country
  delete pub.notes
  delete pub.source
  return pub
}

/** Fetch verified reports alongside their exact stored string (needed to zrem
 *  a specific member). Used by the cleanup cron and the lost-dog remove route. */
export async function getVerifiedRaw(limit = 5000): Promise<{ raw: string; report: Report }[]> {
  const client = getRedisClient()
  if (!client) return []
  try {
    const raw = await client.zrange('reports:verified', 0, limit - 1, { rev: true })
    return (raw as string[]).map(s => ({ raw: s, report: JSON.parse(s) as Report }))
  } catch (e) {
    console.error('getVerifiedRaw error:', e)
    return []
  }
}

/** Remove specific members (by their exact stored strings) from the verified set.
 *  Returns the number removed. */
export async function removeVerifiedRaw(raws: string[]): Promise<number> {
  const client = getRedisClient()
  if (!client || raws.length === 0) return 0
  return client.zrem('reports:verified', ...raws)
}

/** Remove a verified report by id and return it (for photo cleanup). */
export async function removeVerifiedById(id: string): Promise<Report | null> {
  const all = await getVerifiedRaw()
  const match = all.find(({ report }) => report.id === id)
  if (!match) return null
  await removeVerifiedRaw([match.raw])
  return match.report
}

// ─── Moderation flags ───
const FLAGS_INDEX = 'moderation:flags'

/** A user-submitted flag aggregated per report. */
export interface FlagRecord {
  id: string
  count: number
  reasons: string[]
  summary: string   // short human label for the dashboard
  firstAt: number
  lastAt: number
}

/** Record a flag against a report. Aggregates by report id. Returns new count. */
export async function addFlag(id: string, reason: string, summary: string): Promise<number> {
  const client = getRedisClient()
  if (!client) return 0
  const now = Date.now()
  const raw = await client.get<string>(`flag:${id}`)
  const rec: FlagRecord = raw
    ? JSON.parse(raw)
    : { id, count: 0, reasons: [], summary, firstAt: now, lastAt: now }
  rec.count += 1
  rec.lastAt = now
  rec.summary = summary || rec.summary
  if (reason) rec.reasons = [...rec.reasons, reason].slice(-20) // keep last 20
  await client.set(`flag:${id}`, JSON.stringify(rec))
  await client.zadd(FLAGS_INDEX, { score: now, member: id })
  return rec.count
}

/** List all flagged reports, most recently flagged first. */
export async function listFlags(): Promise<FlagRecord[]> {
  const client = getRedisClient()
  if (!client) return []
  const ids = (await client.zrange(FLAGS_INDEX, 0, -1, { rev: true })) as string[]
  if (ids.length === 0) return []
  const records = await Promise.all(ids.map(id => client.get<string>(`flag:${id}`)))
  return records.filter((r): r is string => !!r).map(r => JSON.parse(r) as FlagRecord)
}

/** Clear a flag (dismiss as a false alarm, or after removing the report). */
export async function clearFlag(id: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await Promise.all([client.del(`flag:${id}`), client.zrem(FLAGS_INDEX, id)])
}

export async function getStats() {
  const client = getRedisClient()
  if (!client) return EMPTY_STATS

  try {
    // Stats are disease/hazard surveillance — lost-dog reports don't count.
    const reports = (await getReports({ limit: 500 })).filter(r => r.kind !== 'lost')
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
