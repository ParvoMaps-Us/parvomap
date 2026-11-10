import { getRedisClient, getReports, toPublicReport, type Report } from '@/lib/redis'
import { emailHash, getAllAlertPrefs, isActiveSubscriber, isConfirmedFree, matchesPrefs, type AlertPrefs } from '@/lib/alerts'
import { sendCaseAlert } from '@/lib/notifications'
import { maskEmail } from '@/lib/log'

// Who gets emailed about a new pin, exactly once.
//
// Two paths publish pins: a visitor's report (app/api/verify) and seeded cases
// written straight to Redis by the weekly disease scan. Both end up here:
// verify calls deliverAlerts() right away, and the hourly sweep cron picks up
// anything it has not seen. The `alert_sent` set makes a send at-most-once per
// (person, pin) no matter which path gets there first. It stores a hash of the
// address, never the address, because it outlives an unsubscribe.

const SENT_SET = 'alert_sent'
const SEEN_SET = 'alert_sweep:seen'
const BOOT_KEY = 'alert_sweep:bootstrapped'

/** At most this many alert emails per person per day, whatever the cause. A
 *  visitor report, on the visitor-report path. It bounds what a run of fake
 *  reports near one ZIP can do. Seeded pins (the sweep) are not counted. */
export const MAX_ALERTS_PER_PERSON_PER_DAY = 3

/** More new pins than this in one sweep is not a seed batch, it is a bad read
 *  or a bulk import. Record them and email no one. */
export const MAX_FRESH_PER_SWEEP = 100

/** Count one alert against a person's daily cap. False = over the cap. Fails
 *  closed: on a Redis error we skip the email rather than lift the cap. */
async function underDailyCap(who: string, now: number): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return false
  const day = new Date(now).toISOString().slice(0, 10)
  const key = `alert_cap:${who}:${day}`
  try {
    const n = await client.incr(key)
    if (n === 1) await client.expire(key, 60 * 60 * 48)
    return n <= MAX_ALERTS_PER_PERSON_PER_DAY
  } catch (e) {
    console.error('Alert daily cap check failed:', e)
    return false
  }
}

/** Error text for logs with the recipient's address masked (a mail API error
 *  can echo the address back). */
function safeErr(e: unknown, email: string): string {
  const msg = e instanceof Error ? e.message : String(e)
  return msg.split(email).join(maskEmail(email)).slice(0, 300)
}

/** Don't email about old news. Seeded pins carry the INCIDENT date, which can
 *  be weeks back; past this age a pin still shows on the map but alerts no one. */
export const MAX_ALERT_AGE_MS = 60 * 24 * 60 * 60 * 1000

/** Is this pin something to email about at all? Pure. */
export function isAlertable(r: Report, now = Date.now()): boolean {
  if (!r.id || r.verified === false) return false
  if (typeof r.timestamp !== 'number') return false
  const age = now - r.timestamp
  return age <= MAX_ALERT_AGE_MS && age > -24 * 60 * 60 * 1000
}

/** The pins in `reports` this person should hear about. Pure. */
export function selectHits(reports: Report[], prefs: AlertPrefs, now = Date.now()): Report[] {
  return reports.filter(r => isAlertable(r, now) && matchesPrefs(r, prefs))
}

/** Pins the sweep has not handled yet. Pure. */
export function pickFresh(reports: Report[], seen: Set<string>): Report[] {
  return reports.filter(r => !!r.id && !seen.has(r.id))
}

async function saddChunked(key: string, members: string[]): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  for (let i = 0; i < members.length; i += 500) {
    const chunk = members.slice(i, i + 500)
    if (chunk.length) await client.sadd(key, chunk[0], ...chunk.slice(1))
  }
}

/** Tell the sweep a pin was already handled (verify does this for its own pins). */
export async function markReportSeen(id: string): Promise<void> {
  if (!id) return
  await saddChunked(SEEN_SET, [id])
}

/**
 * Email everyone whose alert area matches these pins. One email per person,
 * listing every matching pin. Returns counts only (never addresses).
 *
 * Eligible = a confirmed free signup, or a paid record with a live subscription.
 */
export async function deliverAlerts(
  reports: Report[],
  opts: { excludeEmail?: string; maxSends?: number; now?: number; dailyCap?: boolean } = {},
): Promise<{ matched: number; sent: number; failed: number; capped: boolean }> {
  const out = { matched: 0, sent: 0, failed: 0, capped: false }
  const client = getRedisClient()
  if (!client || reports.length === 0) return out

  const now = opts.now ?? Date.now()
  const maxSends = opts.maxSends ?? 200
  const exclude = opts.excludeEmail?.trim().toLowerCase()
  // Strip moderation-only fields (reporter notes, IP country) before anything
  // reaches an email template.
  const pub = reports.map(toPublicReport)
  const prefs = await getAllAlertPrefs()

  for (const p of prefs) {
    const email = p.email?.toLowerCase()
    if (!email || email === exclude) continue
    const hits = selectHits(pub, p, now)
    if (hits.length === 0) continue

    const eligible = isConfirmedFree(p) || (p.tier !== 'free' && (await isActiveSubscriber(email)))
    if (!eligible) continue
    out.matched++

    if (out.sent >= maxSends) { out.capped = true; continue }

    // Claim each (person, pin) pair. SADD returns 1 only for the first claimer,
    // so the verify path and the sweep can never both send the same pin.
    const who = emailHash(email)
    const claimed: Report[] = []
    for (const r of hits) {
      try {
        if ((await client.sadd(SENT_SET, `${who}|${r.id}`)) === 1) claimed.push(r)
      } catch (e) {
        console.error('Alert claim failed:', e)
      }
    }
    if (claimed.length === 0) continue

    // Over today's cap: keep the claims (these pins are done for this person)
    // and send nothing. Only the visitor-report path is capped (opts.dailyCap):
    // seeded pins come through the sweep, are sourced, and already arrive as
    // one grouped email, so fake visitor pins cannot use up their budget.
    if (opts.dailyCap && !(await underDailyCap(who, now))) {
      console.warn('Alert skipped, daily cap reached for one recipient')
      continue
    }

    try {
      await sendCaseAlert(email, claimed, p.zip)
      out.sent++
    } catch (e) {
      out.failed++
      console.error('Case alert send failed:', maskEmail(email), safeErr(e, email))
      // Release the claims so a later run is free to try again.
      for (const r of claimed) await client.srem(SENT_SET, `${who}|${r.id}`).catch(() => {})
    }
  }
  if (out.capped) console.warn('Alert delivery hit the per-run send cap:', maxSends)
  return out
}

/**
 * Hourly sweep: find pins nobody has been alerted about (seeded cases skip
 * /api/verify) and deliver them.
 *
 * The first run only records what is already on the map and sends nothing, so
 * turning this on never emails about the existing pins.
 */
export async function sweepNewReports(): Promise<{
  bootstrapped: boolean; fresh: number; matched: number; sent: number; failed: number
}> {
  const client = getRedisClient()
  if (!client) return { bootstrapped: false, fresh: 0, matched: 0, sent: 0, failed: 0 }

  const all = await getReports({ limit: 5000 })
  // getReports returns [] on ANY read error. Treating that as "the map is
  // empty" would either bootstrap with nothing seen or prune the whole seen
  // set, and the next good read would then email every recent pin. An empty
  // read changes nothing.
  if (all.length === 0) {
    console.warn('Alert sweep: no reports read, skipping this run')
    return { bootstrapped: false, fresh: 0, matched: 0, sent: 0, failed: 0 }
  }
  const ids = all.map(r => r.id).filter(Boolean)

  if (!(await client.get(BOOT_KEY))) {
    await saddChunked(SEEN_SET, ids)
    await client.set(BOOT_KEY, String(Date.now()))
    return { bootstrapped: true, fresh: 0, matched: 0, sent: 0, failed: 0 }
  }

  const seen = new Set((await client.smembers(SEEN_SET)) as string[])
  const fresh = pickFresh(all, seen)

  // Mark first, send second: a crash mid-send must not re-email on the next run.
  await saddChunked(SEEN_SET, fresh.map(r => r.id))

  // Forget ids of pins that have left the map, so the set stays the map's size.
  const live = new Set(ids)
  const stale = [...seen].filter(id => !live.has(id))
  for (let i = 0; i < stale.length; i += 500) {
    const chunk = stale.slice(i, i + 500)
    if (chunk.length) await client.srem(SEEN_SET, chunk[0], ...chunk.slice(1))
  }

  if (fresh.length === 0) return { bootstrapped: false, fresh: 0, matched: 0, sent: 0, failed: 0 }
  if (fresh.length > MAX_FRESH_PER_SWEEP) {
    console.warn('Alert sweep: too many new pins at once, recorded without emailing:', fresh.length)
    return { bootstrapped: false, fresh: fresh.length, matched: 0, sent: 0, failed: 0 }
  }
  const res = await deliverAlerts(fresh)
  return { bootstrapped: false, fresh: fresh.length, matched: res.matched, sent: res.sent, failed: res.failed }
}
