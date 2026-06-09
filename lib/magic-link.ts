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

// ─── Unsubscribe token ────────────────────────────────────────────────────────
// Non-expiring HMAC over just the email — unsubscribe links in emails must keep
// working indefinitely. Different derivation ('unsub.') so it can't be swapped
// for a magic-login token.

// ─── Admin magic link + session ───────────────────────────────────────────────
// Same shape as the clinic flow but with distinct HMAC derivations ('admin.' /
// 'admin-session.') so an alerts/clinic token for the same email can never be
// replayed against the admin login. Shorter login-link and session TTLs than
// clinic: this credential moderates the whole map.

export const ADMIN_SESSION_COOKIE = 'admin_session'
export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days
const ADMIN_LINK_TTL_MS = 1000 * 60 * 15 // 15 minutes

function adminSign(email: string, exp: number): string {
  return createHmac('sha256', secret()).update(`admin.${email.toLowerCase()}.${exp}`).digest('hex')
}

export function makeAdminToken(email: string): { exp: number; token: string } {
  const exp = Date.now() + ADMIN_LINK_TTL_MS
  return { exp, token: adminSign(email, exp) }
}

export function verifyAdminToken(email: string, exp: number, token: string): boolean {
  if (!email || !exp || !token) return false
  if (Number.isNaN(exp) || exp < Date.now()) return false
  const expected = adminSign(email, exp)
  if (token.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

function adminSessionSig(email: string, exp: number): string {
  return createHmac('sha256', secret()).update(`admin-session.${email.toLowerCase()}.${exp}`).digest('hex')
}

/** Signed cookie value for an admin session: "<encodedEmail>.<exp>.<sig>". */
export function signAdminSession(email: string, ttlMs: number = ADMIN_SESSION_TTL_MS): string {
  const e = email.trim().toLowerCase()
  const exp = Date.now() + ttlMs
  return `${encodeURIComponent(e)}.${exp}.${adminSessionSig(e, exp)}`
}

/** Returns the email from a valid, unexpired admin session cookie, else null. */
export function readAdminSession(value: string | undefined | null): string | null {
  if (!value) return null
  const parts = value.split('.')
  if (parts.length < 3) return null
  const sig = parts.pop() as string
  const expStr = parts.pop() as string
  let email: string
  try {
    email = decodeURIComponent(parts.join('.')).toLowerCase()
  } catch {
    return null
  }
  const exp = Number(expStr)
  if (!email || Number.isNaN(exp) || exp < Date.now()) return null
  const expected = adminSessionSig(email, exp)
  if (sig.length !== expected.length) return null
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? email : null
  } catch {
    return null
  }
}

// ─── Clinic dashboard session ─────────────────────────────────────────────────
// After a clinic opens a valid magic link we mint a longer-lived signed session
// value to store in an httpOnly cookie, so they stay signed in without
// re-requesting a link each day. The cookie is just a credential — the dashboard
// still re-checks the live Pro Clinic status on every load.

export const CLINIC_SESSION_COOKIE = 'clinic_session'
export const CLINIC_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

function sessionSig(email: string, exp: number): string {
  return createHmac('sha256', secret()).update(`clinic-session.${email.toLowerCase()}.${exp}`).digest('hex')
}

/** Signed cookie value for a clinic session: "<encodedEmail>.<exp>.<sig>". */
export function signClinicSession(email: string, ttlMs: number = CLINIC_SESSION_TTL_MS): string {
  const e = email.trim().toLowerCase()
  const exp = Date.now() + ttlMs
  return `${encodeURIComponent(e)}.${exp}.${sessionSig(e, exp)}`
}

/** Returns the email from a valid, unexpired session cookie value, else null. */
export function readClinicSession(value: string | undefined | null): string | null {
  if (!value) return null
  // Parse from the right: sig (hex) and exp (digits) never contain dots, but the
  // encoded email can (encodeURIComponent leaves "." untouched, e.g. ".us").
  const parts = value.split('.')
  if (parts.length < 3) return null
  const sig = parts.pop() as string
  const expStr = parts.pop() as string
  const encEmail = parts.join('.')
  let email: string
  try {
    email = decodeURIComponent(encEmail).toLowerCase()
  } catch {
    return null
  }
  const exp = Number(expStr)
  if (!email || Number.isNaN(exp) || exp < Date.now()) return null
  const expected = sessionSig(email, exp)
  if (sig.length !== expected.length) return null
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? email : null
  } catch {
    return null
  }
}

export function signUnsubToken(email: string): string {
  return createHmac('sha256', secret()).update(`unsub.${email.toLowerCase()}`).digest('hex')
}

export function verifyUnsubToken(email: string, token: string): boolean {
  if (!email || !token) return false
  const expected = signUnsubToken(email)
  if (token.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}
