import { NextRequest } from 'next/server'
import { isActiveSubscriber, saveAlertPrefs, type AlertPrefs } from '@/lib/alerts'
import { verifyMagicToken } from '@/lib/magic-link'
import { geocodeZip } from '@/lib/geocode'
import { DISEASE_MAP } from '@/lib/diseases'

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

const VALID_DISEASES = new Set(Object.keys(DISEASE_MAP))

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req.headers.get('origin'))

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400, headers: cors })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const exp = Number(body.exp)
  const token = String(body.token ?? '')

  // 1. Authenticate the magic link.
  if (!verifyMagicToken(email, exp, token)) {
    return Response.json({ error: 'Your link is invalid or expired. Request a new one.' }, { status: 401, headers: cors })
  }

  // 2. Re-check the subscription (could have lapsed since the link was issued).
  if (!(await isActiveSubscriber(email))) {
    return Response.json({ error: 'No active subscription found for this email.' }, { status: 403, headers: cors })
  }

  // 3. Validate inputs.
  const zip = String(body.zip ?? '').trim()
  if (!/^\d{5}$/.test(zip)) {
    return Response.json({ error: 'Enter a valid 5-digit ZIP.' }, { status: 400, headers: cors })
  }

  const radiusMiles = Math.min(100, Math.max(1, Number(body.radiusMiles) || 25))
  const lostDogs = Boolean(body.lostDogs)

  let diseases: 'all' | string[]
  if (body.diseases === 'all') {
    diseases = 'all'
  } else if (Array.isArray(body.diseases)) {
    diseases = body.diseases.map(String).filter(d => VALID_DISEASES.has(d))
  } else {
    diseases = 'all'
  }

  // Must want at least one kind of alert.
  if (diseases !== 'all' && diseases.length === 0 && !lostDogs) {
    return Response.json({ error: 'Pick at least one disease or enable lost-dog alerts.' }, { status: 400, headers: cors })
  }

  // 4. Geocode the ZIP so delivery can do radius matching.
  const geo = await geocodeZip(zip)

  const prefs: AlertPrefs = {
    email,
    zip,
    lat: geo?.lat,
    lng: geo?.lng,
    radiusMiles,
    diseases,
    lostDogs,
    updatedAt: Date.now(),
  }

  try {
    await saveAlertPrefs(prefs)
    return Response.json({ ok: true, city: geo?.city, state: geo?.state }, { headers: cors })
  } catch (e) {
    console.error('Alert save error:', e)
    return Response.json({ error: 'Could not save. Please try again.' }, { status: 500, headers: cors })
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
