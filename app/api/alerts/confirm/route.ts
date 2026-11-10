import { NextRequest } from 'next/server'
import { consumePendingSignup, restorePendingSignup, isSignupToken } from '@/lib/free-alerts'
import { FREE_RADIUS_MILES, getAlertPrefs, isActiveSubscriber, saveAlertPrefs, type AlertPrefs } from '@/lib/alerts'
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit'
import { maskEmail } from '@/lib/log'

// Free ZIP alerts, step 2: the button on /alerts/confirm posts the emailed
// token here. Only now does the address join the alert list. A POST (not the
// page's GET) does the work, so a mail scanner that opens the link cannot
// subscribe anyone.

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 'alerts-confirm', 20, '1 m')
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSeconds)

  let token = ''
  try {
    const body = await req.json()
    token = String(body?.token ?? '')
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (!isSignupToken(token)) {
    return Response.json({ error: 'This link is not valid. Sign up again from the map.' }, { status: 400 })
  }

  const pending = await consumePendingSignup(token)
  if (!pending) {
    return Response.json({ error: 'This link has expired or was already used. Sign up again from the map.' }, { status: 410 })
  }

  try {
    // A paying member's saved settings (radius, diseases, brands) must not be
    // replaced by a free record. Their alerts already cover this.
    const existing = await getAlertPrefs(pending.email)
    if (existing && existing.tier !== 'free' && (await isActiveSubscriber(pending.email))) {
      return Response.json({ ok: true, zip: existing.zip })
    }

    const now = Date.now()
    const prefs: AlertPrefs = {
      email: pending.email,
      zip: pending.zip,
      lat: pending.lat,
      lng: pending.lng,
      radiusMiles: FREE_RADIUS_MILES,
      diseases: 'all',
      lostDogs: false,
      tier: 'free',
      recalls: true,
      confirmedAt: now,
      updatedAt: now,
    }
    await saveAlertPrefs(prefs)
    return Response.json({ ok: true, zip: pending.zip, city: pending.city, state: pending.state })
  } catch (e) {
    console.error('Free alert confirm failed:', maskEmail(pending.email), e)
    // The token is used up; put it back so the emailed link still works.
    await restorePendingSignup(token, pending).catch(() => {})
    return Response.json({ error: 'Could not turn alerts on. Please try again.' }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
