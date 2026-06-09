import { NextRequest } from 'next/server'
import { isActiveSubscriber } from '@/lib/alerts'
import { makeMagicToken } from '@/lib/magic-link'
import { sendAlertMagicLink } from '@/lib/notifications'
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit'

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

  // Sends an email per request — classic email-bomb vector without a cap.
  const rl = await checkRateLimit(req, 'alerts-link', 5, '1 h')
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSeconds, cors)
  }

  let email = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '').trim().toLowerCase()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400, headers: cors })
  }

  // Basic shape check.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email.' }, { status: 400, headers: cors })
  }

  try {
    // Only paying subscribers get a link — but we ALWAYS respond the same way so
    // the endpoint can't be used to probe who has an account.
    if (await isActiveSubscriber(email)) {
      const { exp, token } = makeMagicToken(email)
      const origin = req.headers.get('origin') ?? 'https://www.parvomaps.us'
      const url = `${origin}/alerts/manage?e=${encodeURIComponent(email)}&exp=${exp}&t=${token}`
      try {
        await sendAlertMagicLink(email, url)
      } catch (e) {
        console.error('Alert magic-link email failed:', e)
      }
    } else {
      console.log('Alert link requested by non-subscriber:', email)
    }
  } catch (e) {
    console.error('request-link error:', e)
  }

  // Generic response regardless of subscription status.
  return Response.json({ ok: true }, { headers: cors })
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
