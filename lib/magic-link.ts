import { createHmac, timingSafeEqual } from 'crypto'

// Stateless magic-link token for the alerts preferences page. Signs the email
// plus an expiry so a link can't be reused forever and can't be forged without
// the secret. No storage needed — verify recomputes the HMAC.
function secret(): string {
  return process.env.VERIFICATION_SECRET || process.env.CRON_SECRET || 'parvomaps-dev-secret'
}

const TTL_MS = 1000 * 60 * 60 * 24 // 24 hours

function sign(email: string, exp: number): string {
  return createHmac('sha256', secret()).update(`${email.toLowerCase()}.${exp}`).digest('hex')
}

/** Returns { exp, token } for embedding in a magic link. */
export function makeMagicToken(email: string): { exp: number; token: string } {
  const exp = Date.now() + TTL_MS
  return { exp, token: sign(email, exp) }
}

/** Verify an email+exp+token triple. Rejects expired or tampered links. */
export function verifyMagicToken(email: string, exp: number, token: string): boolean {
  if (!email || !exp || !token) return false
  if (Number.isNaN(exp) || exp < Date.now()) return false
  const expected = sign(email, exp)
  if (token.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}
