import { NextRequest } from 'next/server'
import { isProClinic } from '@/lib/alerts'
import { makeMagicToken } from '@/lib/magic-link'
import { sendClinicMagicLink } from '@/lib/notifications'

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

  let email = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '').trim().toLowerCase()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400, headers: cors })
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email.' }, { status: 400, headers: cors })
  }

  try {
    // Only active Pro Clinic accounts get a link — but we ALWAYS respond the same
    // way so the endpoint can't be used to probe who has which plan.
    if (await isProClinic(email)) {
      const { exp, token } = makeMagicToken(email)
      const origin = req.headers.get('origin') ?? 'https://www.parvomaps.us'
      const url = `${origin}/api/clinic/login?e=${encodeURIComponent(email)}&exp=${exp}&t=${token}`
      try {
        await sendClinicMagicLink(email, url)
      } catch (e) {
        console.error('Clinic magic-link email failed:', e)
      }
    } else {
      console.log('Clinic dashboard link requested by non-clinic:', email)
    }
  } catch (e) {
    console.error('clinic request-link error:', e)
  }

  return Response.json({ ok: true }, { headers: cors })
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
