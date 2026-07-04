import { createHash } from 'crypto'
import { getRedisClient } from './redis'

// One-time consumption guard for login magic links. The link tokens are
// stateless HMACs (see lib/magic-link.ts); this records that a given token has
// been redeemed so a second redemption — replay from browser history, a leaked
// URL, a shoulder-surfed link — is rejected until the token would expire anyway.
//
// Consumption happens on the POST that a human click triggers, never the GET a
// mail scanner / link-safety prefetcher issues, so a legitimate login link is
// not burned before the real user ever arrives. We key on a hash of the token,
// not the token itself, so a Redis dump never yields a live credential.

function tokenKey(token: string): string {
  return `magic:used:${createHash('sha256').update(token).digest('hex')}`
}

/**
 * Atomically mark a login token as used. Returns true on the FIRST redemption
 * (caller may proceed to mint a session) and false if it was already redeemed
 * (reject as a replay). The marker's TTL tracks the token's own expiry so it
 * never outlives the token it guards.
 *
 * Fails OPEN when Redis is unconfigured (returns true) — consistent with the
 * rest of the app's availability-over-strictness stance. Single-use is a
 * hardening layer on top of the HMAC + expiry, not the primary auth control.
 */
export async function consumeMagicToken(token: string, exp: number): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return true

  // Seconds until the token expires on its own; floor at 1 so SET has a valid TTL.
  const ttl = Math.max(1, Math.ceil((exp - Date.now()) / 1000))
  try {
    // SET … NX: succeeds ("OK") only if the key is absent; returns null if the
    // token was already consumed. This is the atomic check-and-set that makes
    // the guard race-free even under concurrent redemptions.
    const res = await client.set(tokenKey(token), '1', { nx: true, ex: ttl })
    return res === 'OK'
  } catch (e) {
    console.error('Magic token consume failed:', e)
    return true // fail open — don't lock out real users on a Redis hiccup
  }
}
