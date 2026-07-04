import { NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { findSubscriberCustomerId } from '@/lib/alerts'
import { sendBillingPortalLink } from '@/lib/notifications'
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit'
import { maskEmail } from '@/lib/log'

// Emails a member a link to the Stripe Customer Portal (update payment, view
// invoices, cancel). We deliberately do NOT return the portal URL to the caller:
// that would let anyone who knows/guesses a subscriber's email open that
// person's billing portal (IDOR), and the success/failure difference would leak
// who is a subscriber (enumeration). Instead we verify email ownership by
// sending the link to the mailbox, and always respond identically.
// (The portal must be enabled once in Stripe → Settings → Billing → Customer portal.)
export async function POST(req: NextRequest) {
  // Sends an email per request → email-bomb + enumeration surface. Cap per IP.
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

  // Only mint + send a portal link if the email actually owns a subscription —
  // but respond the same way regardless so the endpoint can't be used to probe
  // who is a subscriber.
  try {
    const customerId = await findSubscriberCustomerId(email)
    if (customerId) {
      const session = await stripe.billingPortal.sessions.create({
        customer:   customerId,
        // Fixed trusted return host — never the client-controlled Origin header.
        return_url: 'https://www.parvomaps.us/account',
      })
      try {
        await sendBillingPortalLink(email, session.url)
      } catch (e) {
        console.error('Billing portal email failed:', e)
      }
    } else {
      console.log('Billing portal requested by non-subscriber:', maskEmail(email))
    }
  } catch (e) {
    console.error('Portal session error:', e)
  }

  // Generic response regardless of subscription status.
  return Response.json({
    ok: true,
    message: 'If that email has a subscription, a link to manage billing is on its way.',
  })
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
