import { NextRequest } from 'next/server'
import { getStripe, priceIdFor, PLANS, type PlanKey } from '@/lib/stripe'

// Same canonical-host CORS dance as /api/report: the pricing page may post from
// the apex or the www host, and a cross-origin 308 redirect would silently drop
// the request. Reflect known origins.
const ALLOWED_ORIGINS = new Set([
  'https://parvomaps.us',
  'https://www.parvomaps.us',
])

function corsHeaders(origin: string | null): Record<string, string> {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return {
      'Access-Control-Allow-Origin':  origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary':                         'Origin',
    }
  }
  return {}
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req.headers.get('origin'))

  const stripe = getStripe()
  if (!stripe) {
    return Response.json({ error: 'Payments are not configured yet.' }, { status: 503, headers: cors })
  }

  let plan: PlanKey
  try {
    const body = await req.json()
    plan = body?.plan
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400, headers: cors })
  }

  if (!plan || !(plan in PLANS)) {
    return Response.json({ error: 'Unknown plan.' }, { status: 400, headers: cors })
  }

  const priceId = priceIdFor(plan)
  if (!priceId) {
    // Price not yet created/configured in Stripe — surface clearly instead of a 500.
    return Response.json(
      { error: 'This plan isn’t available yet. Check back soon.' },
      { status: 503, headers: cors },
    )
  }

  // Build absolute return URLs from the request origin so this works on either host.
  const origin = req.headers.get('origin') ?? 'https://parvomaps.us'
  const isBusiness = PLANS[plan].audience === 'business'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // Stripe Tax: compute and collect the right sales tax per customer location.
      automatic_tax: { enabled: true },
      // Required so Stripe Tax has an address to base the rate on.
      billing_address_collection: 'required',
      // Let businesses enter a VAT/EIN; harmless for consumers.
      tax_id_collection: { enabled: true },
      // Note: subscription mode always creates a Customer, so `customer_creation`
      // must NOT be set here — Stripe rejects it outside `payment` mode.
      allow_promotion_codes: true,
      metadata: { plan },
      subscription_data: { metadata: { plan } },
      success_url: `${origin}/pro?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/pro?checkout=cancelled`,
    })

    return Response.json({ url: session.url }, { headers: cors })
  } catch (e) {
    console.error('Checkout session error:', e, { plan, isBusiness })
    return Response.json({ error: 'Could not start checkout. Please try again.' }, { status: 500, headers: cors })
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
