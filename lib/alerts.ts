import { createHash } from 'crypto'
import { getRedisClient, type Report } from '@/lib/redis'

// ─── Subscriber lookup ────────────────────────────────────────────────────────
// The Stripe webhook writes records into the `subscribers` hash keyed by Stripe
// customer id, each value a JSON blob with { email, plan, status, ... }. Alerts
// are a paid perk, so we gate the preferences flow on an *active* subscription.

interface SubscriberRecord {
  email: string | null
  plan: string | null
  status: 'active' | 'cancelled'
}

interface SubscriberRecordFull extends SubscriberRecord {
  customerId?: string | null
}

/** True if this email belongs to an active subscriber. Case-insensitive. */
export async function isActiveSubscriber(email: string): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return false
  const target = email.trim().toLowerCase()
  if (!target) return false

  const all = await client.hgetall<Record<string, string>>('subscribers')
  if (!all) return false

  for (const raw of Object.values(all)) {
    try {
      const rec = (typeof raw === 'string' ? JSON.parse(raw) : raw) as SubscriberRecord
      if (rec.status === 'active' && rec.email?.toLowerCase() === target) return true
    } catch {
      // skip malformed record
    }
  }
  return false
}

/** The plan key of an *active* subscription for this email, or null. Case-insensitive. */
export async function getActiveSubscriberPlan(email: string): Promise<string | null> {
  const client = getRedisClient()
  if (!client) return null
  const target = email.trim().toLowerCase()
  if (!target) return null

  const all = await client.hgetall<Record<string, string>>('subscribers')
  if (!all) return null

  for (const raw of Object.values(all)) {
    try {
      const rec = (typeof raw === 'string' ? JSON.parse(raw) : raw) as SubscriberRecord & { plan?: string | null }
      if (rec.status === 'active' && rec.email?.toLowerCase() === target) return rec.plan ?? null
    } catch {
      // skip malformed record
    }
  }
  return null
}

/** True if this email belongs to an active Pro Clinic subscriber. */
export async function isProClinic(email: string): Promise<boolean> {
  return (await getActiveSubscriberPlan(email)) === 'pro-clinic'
}

/** Find the Stripe customer id for an email (any status) — used to open the
 *  billing portal. Returns null if no matching subscriber record exists. */
export async function findSubscriberCustomerId(email: string): Promise<string | null> {
  const client = getRedisClient()
  if (!client) return null
  const target = email.trim().toLowerCase()
  if (!target) return null

  const all = await client.hgetall<Record<string, string>>('subscribers')
  if (!all) return null

  for (const [customerId, raw] of Object.entries(all)) {
    try {
      const rec = (typeof raw === 'string' ? JSON.parse(raw) : raw) as SubscriberRecordFull
      if (rec.email?.toLowerCase() === target) return rec.customerId ?? customerId
    } catch {
      // skip
    }
  }
  return null
}

// ─── Pro Clinic: disease-tracking requests ────────────────────────────────────

export interface DiseaseRequest {
  email: string
  disease: string
  note: string
  ts: number
}

/** Persist a clinic's "please track this disease" request (newest first). */
export async function saveDiseaseRequest(req: DiseaseRequest): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.lpush('clinic_disease_requests', JSON.stringify(req))
}

/** All clinic disease-tracking requests, newest first. */
export async function getDiseaseRequests(limit = 200): Promise<DiseaseRequest[]> {
  const client = getRedisClient()
  if (!client) return []
  const raw = await client.lrange<string>('clinic_disease_requests', 0, limit - 1)
  if (!raw) return []
  const out: DiseaseRequest[] = []
  for (const item of raw) {
    try {
      out.push((typeof item === 'string' ? JSON.parse(item) : item) as DiseaseRequest)
    } catch {
      // skip malformed
    }
  }
  return out
}

// ─── Alert preferences ────────────────────────────────────────────────────────

export interface AlertPrefs {
  email: string
  zip: string
  lat?: number
  lng?: number
  /** Notify within this many miles of the ZIP centroid. */
  radiusMiles: number
  /** 'all' diseases, or a specific list of disease keys. */
  diseases: 'all' | string[]
  /** Also alert on nearby lost-dog reports. */
  lostDogs: boolean
  /** Dog-food brands the subscriber feeds — they get a recall alert when one of
   *  these shows up in an FDA pet-food recall. Lowercased, deduped. (Paid perk.) */
  foodBrands?: string[]
  /** 'free' = a free alert signup (confirmed by email, no subscription). Absent
   *  on paid records, which are gated on a live subscription instead. */
  tier?: 'free'
  /** When the free signup's confirmation link was used (double opt-in). */
  confirmedAt?: number
  /** Free tier: also email new pet-food recalls. Absent/true = on. */
  recalls?: boolean
  updatedAt: number
}

/** Free tier limits: one ZIP, this radius, all diseases, no lost-dog alerts. */
export const FREE_RADIUS_MILES = 10

/** A free signup that finished the email confirmation step. */
export function isConfirmedFree(p: Pick<AlertPrefs, 'tier' | 'confirmedAt'>): boolean {
  return p.tier === 'free' && !!p.confirmedAt
}

const PREFS_HASH = 'alert_prefs'

function keyFor(email: string): string {
  return email.trim().toLowerCase()
}

export async function saveAlertPrefs(prefs: AlertPrefs): Promise<void> {
  const client = getRedisClient()
  if (!client) throw new Error('Redis not configured')
  const normalized: AlertPrefs = { ...prefs, email: keyFor(prefs.email) }
  await client.hset(PREFS_HASH, { [normalized.email]: JSON.stringify(normalized) })
}

export async function deleteAlertPrefs(email: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.hdel(PREFS_HASH, keyFor(email))
}

/**
 * Remove this address's entries from the "already sent" sets. Called on
 * unsubscribe so nothing derived from the address stays behind (the privacy
 * page promises that). Safe to lose: the sweep and the recall cron only send
 * things that are new, so a later re-signup cannot replay old alerts.
 */
export async function forgetAlertHistory(email: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  const prefix = `${emailHash(email)}|`
  for (const key of ['alert_sent', 'recall_alerts_sent']) {
    let cursor = '0'
    do {
      const [next, members] = await client.sscan(key, cursor, { match: `${prefix}*`, count: 500 })
      cursor = String(next)
      const mine = (members as string[]).filter(m => String(m).startsWith(prefix))
      if (mine.length) await client.srem(key, mine[0], ...mine.slice(1))
    } while (cursor !== '0')
  }
}

export async function getAlertPrefs(email: string): Promise<AlertPrefs | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.hget<string>(PREFS_HASH, keyFor(email))
  if (!raw) return null
  try {
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as AlertPrefs
  } catch {
    return null
  }
}

/** All saved preference records — used by the delivery step to find matches. */
export async function getAllAlertPrefs(): Promise<AlertPrefs[]> {
  const client = getRedisClient()
  if (!client) return []
  const all = await client.hgetall<Record<string, string>>(PREFS_HASH)
  if (!all) return []
  const out: AlertPrefs[] = []
  for (const raw of Object.values(all)) {
    try {
      out.push((typeof raw === 'string' ? JSON.parse(raw) : raw) as AlertPrefs)
    } catch {
      // skip
    }
  }
  return out
}

// ─── Recall-alert dedupe ──────────────────────────────────────────────────────
// One Redis set tracks which (subscriber, recall) pairs have already been
// emailed, so the recall-alert cron never double-sends the same recall.
const RECALL_SENT_SET = 'recall_alerts_sent'

/** Stable stand-in for an address in dedupe sets. The "already sent" sets
 *  outlive an unsubscribe, so they must not hold the address itself. */
export function emailHash(email: string): string {
  return createHash('sha256').update(keyFor(email)).digest('hex').slice(0, 32)
}

function recallSentMember(email: string, recallUrl: string): string {
  return `${emailHash(email)}|${recallUrl}`
}

export async function wasRecallAlerted(email: string, recallUrl: string): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return false
  return (await client.sismember(RECALL_SENT_SET, recallSentMember(email, recallUrl))) === 1
}

export async function markRecallAlerted(email: string, recallUrl: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.sadd(RECALL_SENT_SET, recallSentMember(email, recallUrl))
}

// ─── Matching / delivery ──────────────────────────────────────────────────────

/** Rough haversine distance in miles. */
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Does a published report match a subscriber's preferences? */
export function matchesPrefs(report: Report, prefs: AlertPrefs): boolean {
  const isLost = report.kind === 'lost'

  // Type/topic filter.
  if (isLost) {
    if (!prefs.lostDogs) return false
  } else {
    if (prefs.diseases !== 'all' && !prefs.diseases.includes(report.disease)) return false
  }

  // Geographic filter. Need coords on both sides; fall back to ZIP-equality if
  // the report has no coordinates (rare).
  if (prefs.lat != null && prefs.lng != null && report.lat != null && report.lng != null) {
    return distanceMiles(prefs.lat, prefs.lng, report.lat, report.lng) <= prefs.radiusMiles
  }
  return !!report.zip && report.zip === prefs.zip
}

// Delivery (who gets emailed, dedupe, the hourly sweep) lives in lib/alert-delivery.ts.
