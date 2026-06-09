// Single source of the HMAC signing key for every stateless token in the app:
// admin + clinic session cookies, magic links, lost-dog removal tokens, and
// unsubscribe tokens. Prefer a dedicated VERIFICATION_SECRET; fall back to
// CRON_SECRET so existing deployments keep working.
//
// In production we FAIL CLOSED — if neither is set we throw rather than sign
// with a guessable default. A forgeable admin session is far worse than a hard
// error, so a misconfigured deploy should break loudly, not silently open up.
// Outside production a fixed dev value keeps local work frictionless.
const DEV_FALLBACK = 'parvomaps-dev-secret'

export function signingSecret(): string {
  const configured = process.env.VERIFICATION_SECRET || process.env.CRON_SECRET
  if (configured) return configured

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'No signing secret configured: set VERIFICATION_SECRET (or CRON_SECRET) in the environment.',
    )
  }
  return DEV_FALLBACK
}
