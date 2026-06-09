import { NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { findSubscriberCustomerId } from '@/lib/alerts'
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit'

// Opens the Stripe Customer Portal so a member can update payment, view invoices,
// or cancel. We look up their Stripe customer id by email, then mint a portal
// session. (The portal must be enabled once in Stripe → Settings → Billing →
// Customer portal.)
export async function POST(req: NextRequest) {
  // The "no subscription found" error reveals whether an email is a subscriber;
  // throttle to make enumeration impractical.
  const rl = await checkRateLimit(req, 'portal', 5, '1 m')
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSeconds)
  }

  const stripe = getStripe()
  if (!stripe) {
    return Response.json({ error: 'Billing is not configured yet.' }, { status: 503 })
  }

  let email = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '').trim().toLowerCase()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email.' }, { status: 400 })
  }

  const customerId = await findSubscriberCustomerId(email)
  if (!customerId) {
    return Response.json(
      { error: 'No subscription found for that email. Use the email you checked out with.' },
      { status: 404 },
    )
  }

  const origin = req.headers.get('origin') ?? 'https://www.parvomaps.us'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${origin}/account`,
    })
    return Response.json({ url: session.url })
  } catch (e) {
    console.error('Portal session error:', e)
    return Response.json({ error: 'Could not open billing portal. Please try again.' }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
