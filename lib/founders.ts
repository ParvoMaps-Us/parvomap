import { getRedisClient } from '@/lib/redis'

/**
 * Founding Guardian offer — the first {@link FOUNDER_CAP} Guardian subscribers
 * lock today's price for life. A Stripe subscription never changes Price on its
 * own, so the "lifetime lock" is simply a promise never to migrate these subs
 * when Guardian's regular price goes up. This module enforces the cap and tags
 * founders so they can be excluded from any future price migration.
 *
 * Hard cap: once {@link FOUNDER_CAP} slots are claimed, later Guardian signups
 * are NOT marked as founders and are not price-locked.
 */
export const FOUNDER_CAP = 1000

const COUNT_KEY = 'founders:count'   // monotonically-incremented slot counter
const SUBS_KEY = 'founders:subs'     // set of subscription ids already processed (idempotency)
const NUMBERS_KEY = 'founders:numbers' // hash subId -> founder number (audit + idempotent re-reads)

/** Only the consumer Guardian tiers are eligible for founder pricing. */
function isGuardian(plan: string | null): boolean {
  return plan === 'guardian-monthly' || plan === 'guardian-annual'
}

export interface FounderClaim {
  isFounder: boolean
  /** 1..FOUNDER_CAP when a slot was claimed, else null. */
  number: number | null
}

/**
 * Atomically claim a founding slot for a Guardian subscription. Idempotent per
 * subscription id — Stripe retries webhooks, so we guard on a Redis set and only
 * the first delivery consumes a slot.
 */
export async function claimFounderSlot(plan: string | null, subId: string | null): Promise<FounderClaim> {
  if (!isGuardian(plan) || !subId) return { isFounder: false, number: null }

  const client = getRedisClient()
  if (!client) return { isFounder: false, number: null }

  // Idempotency: SADD returns 1 only on first insertion of this sub id.
  // Coerce defensively — this client runs with automaticDeserialization:false.
  const added = Number(await client.sadd(SUBS_KEY, subId))
  if (added !== 1) {
    const existing = await client.hget<string>(NUMBERS_KEY, subId)
    const num = existing ? parseInt(String(existing), 10) : null
    return { isFounder: num !== null && num <= FOUNDER_CAP, number: num }
  }

  const n = Number(await client.incr(COUNT_KEY))
  if (n <= FOUNDER_CAP) {
    await client.hset(NUMBERS_KEY, { [subId]: String(n) })
    return { isFounder: true, number: n }
  }
  // Past the cap — hard stop. This sub is not a founder.
  return { isFounder: false, number: null }
}

export interface FounderStatus {
  taken: number
  remaining: number
  total: number
  open: boolean
}

/** Public-facing scarcity numbers for the pricing page. */
export async function getFounderStatus(): Promise<FounderStatus> {
  const total = FOUNDER_CAP
  const client = getRedisClient()
  if (!client) return { taken: 0, remaining: total, total, open: true }

  const raw = await client.get<string | number>(COUNT_KEY)
  const count = typeof raw === 'number' ? raw : raw ? parseInt(String(raw), 10) : 0
  const taken = Math.min(count, total)
  const remaining = Math.max(0, total - count)
  return { taken, remaining, total, open: remaining > 0 }
}
