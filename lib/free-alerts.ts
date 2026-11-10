import { createHash } from 'crypto'
import { getRedisClient } from './redis'

// Free ZIP alerts: the double opt-in step.
//
// Signup stores a PENDING record under a random token and emails a link. Nothing
// goes on the alert list until the owner of that mailbox presses the button on
// the confirm page. The token is a random UUID held in Redis (24 h, single use),
// not a signed value, so this feature adds no new signing key.

const TTL_SECONDS = 60 * 60 * 24
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface PendingSignup {
  email: string
  zip: string
  lat?: number
  lng?: number
  city?: string
  state?: string
}

function pendingKey(token: string): string {
  return `freealert:pending:${token}`
}

function parse(raw: string | null): PendingSignup | null {
  if (!raw) return null
  try {
    const v = (typeof raw === 'string' ? JSON.parse(raw) : raw) as PendingSignup
    return v && typeof v.email === 'string' && typeof v.zip === 'string' ? v : null
  } catch {
    return null
  }
}

export function isSignupToken(token: string): boolean {
  return UUID_RE.test(token)
}

/** Store a pending signup and return its one-time token. */
export async function savePendingSignup(data: PendingSignup): Promise<string> {
  const client = getRedisClient()
  if (!client) throw new Error('Redis not configured')
  const token = crypto.randomUUID()
  await client.set(pendingKey(token), JSON.stringify(data), { ex: TTL_SECONDS })
  return token
}

/** Read a pending signup WITHOUT using it up (the confirm page's GET, which mail
 *  scanners also fetch, must never burn the link). */
export async function peekPendingSignup(token: string): Promise<PendingSignup | null> {
  const client = getRedisClient()
  if (!client || !isSignupToken(token)) return null
  return parse(await client.get<string>(pendingKey(token)))
}

/** Atomically use up a pending signup. A second call gets null. */
export async function consumePendingSignup(token: string): Promise<PendingSignup | null> {
  const client = getRedisClient()
  if (!client || !isSignupToken(token)) return null
  return parse(await client.getdel<string>(pendingKey(token)))
}

/** Put a consumed signup back (the save failed), so the emailed link still works. */
export async function restorePendingSignup(token: string, data: PendingSignup): Promise<void> {
  const client = getRedisClient()
  if (!client || !isSignupToken(token)) return
  await client.set(pendingKey(token), JSON.stringify(data), { ex: TTL_SECONDS })
}

/** The mailbox an address really delivers to, for the cap key only:
 *  `a.b+tag@gmail.com` and `ab@gmail.com` are one inbox. `+tag` is dropped for
 *  every domain; dots are dropped for Gmail, which ignores them. */
export function capKeyEmail(email: string): string {
  const e = email.trim().toLowerCase()
  const at = e.lastIndexOf('@')
  if (at < 1) return e
  let local = e.slice(0, at).split('+')[0]
  let domain = e.slice(at + 1)
  if (domain === 'googlemail.com') domain = 'gmail.com'
  if (domain === 'gmail.com') local = local.replace(/\./g, '')
  return `${local}@${domain}`
}

/**
 * Cap confirmation emails per ADDRESS (3 a day), on top of the per-IP limit.
 * Without it, someone rotating IPs could fill a stranger's inbox with our
 * "confirm your alerts" email. Keyed on a hash so the key holds no address.
 * Fails closed on a Redis error: better to skip one email than to lift the cap.
 */
export async function underEmailCap(email: string, max = 3): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return false
  const key = `freealert:cap:${createHash('sha256').update(capKeyEmail(email)).digest('hex')}`
  try {
    const n = await client.incr(key)
    if (n === 1) await client.expire(key, TTL_SECONDS)
    return n <= max
  } catch (e) {
    console.error('Free alert cap check failed:', e)
    return false
  }
}
