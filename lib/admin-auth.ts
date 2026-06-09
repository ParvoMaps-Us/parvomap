import { createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { readAdminSession, ADMIN_SESSION_COOKIE } from './magic-link'

/** Emails allowed to request an admin magic link. Comma-separated env var,
 *  e.g. ADMIN_EMAILS="you@parvomaps.us,partner@parvomaps.us". */
export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.trim().toLowerCase())
}

/** Constant-time check against ADMIN_PASSWORD. Hashing both sides first means
 *  timingSafeEqual always gets equal-length buffers, so even the length of the
 *  real password isn't observable. */
export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || !password) return false
  const a = createHash('sha256').update(password).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

/** Admin email from the session cookie of the current request, or null.
 *  Server components / route handlers only. */
export async function getAdminFromCookies(): Promise<string | null> {
  const store = await cookies()
  const email = readAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value)
  // Re-check the allowlist on every request so removing an email from
  // ADMIN_EMAILS revokes any outstanding session immediately.
  return email && isAdminEmail(email) ? email : null
}
