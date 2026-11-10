import { NextRequest } from 'next/server'
import { geocodeZip } from '@/lib/geocode'
import { savePendingSignup, underEmailCap } from '@/lib/free-alerts'
import { sendFreeAlertConfirm } from '@/lib/notifications'
import { checkRateLimit, checkGlobalRateLimit, rateLimitResponse } from '@/lib/ratelimit'
import { maskEmail } from '@/lib/log'

// Free ZIP alerts, step 1: take an email + ZIP and send a confirmation link.
// Nothing joins the alert list here; that happens in /api/alerts/confirm when
// the mailbox owner presses the button (double opt-in).

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export async function POST(req: NextRequest) {
  // Each request can send an email, so cap per IP, and cap the whole endpoint
  // as a circuit breaker for IP-rotating floods (protects the email quota).
  const rl = await checkRateLimit(req, 'alerts-sub', 5, '1 h')
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSeconds)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot: a hidden field real people never fill. Answer like a success so a
  // bot learns nothing.
  if (typeof body.hp_note === 'string' && body.hp_note.trim() !== '') {
    return Response.json({ ok: true })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const zip = String(body.zip ?? '').trim()

  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Enter a valid email.' }, { status: 400 })
  }
  if (!/^\d{5}$/.test(zip)) {
    return Response.json({ error: 'Enter a 5-digit ZIP code.' }, { status: 400 })
  }

  const geo = await geocodeZip(zip)
  if (!geo || Number.isNaN(geo.lat) || Number.isNaN(geo.lng)) {
    return Response.json({ error: 'We could not find that ZIP. Check it and try again.' }, { status: 400 })
  }

  // Whole-endpoint breaker, counted only for requests that would really send
  // (junk input and honeypot hits above do not use it up). Sized under a small
  // email plan's daily quota, so a rotating-IP flood here cannot take the sends
  // that report-verification emails need.
  const global = await checkGlobalRateLimit('alerts-sub-global', 30, '1 h')
  if (!global.ok) return rateLimitResponse(global.retryAfterSeconds)
  const daily = await checkGlobalRateLimit('alerts-sub-day', 80, '1 d')
  if (!daily.ok) return rateLimitResponse(daily.retryAfterSeconds)

  // From here the answer is always the same, so the endpoint cannot be used to
  // learn whether an address is already on the list.
  try {
    if (await underEmailCap(email)) {
      const token = await savePendingSignup({ email, zip, lat: geo.lat, lng: geo.lng, city: geo.city, state: geo.state })
      // Link host is fixed (never taken from the request), so a spoofed Origin
      // cannot point the emailed link somewhere else.
      const url = `https://www.parvomaps.us/alerts/confirm?token=${token}`
      const place = [geo.city, geo.state].filter(Boolean).join(', ')
      await sendFreeAlertConfirm(email, url, zip, place)
    } else {
      console.log('Free alert signup over the per-address cap:', maskEmail(email))
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Free alert signup failed:', maskEmail(email), msg.split(email).join(maskEmail(email)).slice(0, 300))
  }

  return Response.json({ ok: true })
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
