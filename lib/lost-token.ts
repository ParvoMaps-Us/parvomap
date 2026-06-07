import { createHmac, timingSafeEqual } from 'crypto'

// Stateless HMAC token authorizing removal of a lost-dog report. Derived from
// the report id so it needs no storage and stays valid for the report's whole
// life (unlike the 24 h verification token). Put in the confirmation email so an
// owner can take their post + photo down the moment the dog is found.
function secret(): string {
  return process.env.VERIFICATION_SECRET || process.env.CRON_SECRET || 'parvomaps-dev-secret'
}

export function signLostToken(reportId: string): string {
  return createHmac('sha256', secret()).update(reportId).digest('hex')
}

export function verifyLostToken(reportId: string, token: string): boolean {
  if (!token) return false
  const expected = signLostToken(reportId)
  // Compare in constant time; lengths must match for timingSafeEqual.
  if (token.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}
