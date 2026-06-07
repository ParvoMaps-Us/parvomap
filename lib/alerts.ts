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
  updatedAt: number
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
function matches(report: Report, prefs: AlertPrefs): boolean {
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

/**
 * Emails of active subscribers who should be alerted about this report.
 * Excludes a given email (e.g. the reporter themselves) when provided.
 */
export async function findMatchingAlertEmails(report: Report, excludeEmail?: string): Promise<string[]> {
  const prefs = await getAllAlertPrefs()
  const exclude = excludeEmail?.trim().toLowerCase()
  const emails = new Set<string>()
  for (const p of prefs) {
    if (exclude && p.email.toLowerCase() === exclude) continue
    if (matches(report, p)) emails.add(p.email)
  }
  // Re-check active subscription so cancelled members stop receiving alerts.
  const active: string[] = []
  for (const email of emails) {
    if (await isActiveSubscriber(email)) active.push(email)
  }
  return active
}
