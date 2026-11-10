import { NextRequest } from 'next/server'
import { deleteAlertPrefs, forgetAlertHistory } from '@/lib/alerts'
import { verifyUnsubToken } from '@/lib/magic-link'
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit'

// Two callers:
// 1. The button on /alerts/unsubscribe posts JSON { email, token }.
// 2. A mail app's own "Unsubscribe" button (RFC 8058 one-click) posts a form
//    body to the URL in the List-Unsubscribe header, so the email and token
//    come from the query string (?e=...&t=...).
// Either way the signed token is what proves the request came from the email.
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 'alerts-unsub', 30, '1 m')
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSeconds)

  let email = ''
  let token = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '')
    token = String(body?.token ?? '')
  } catch {
    // Not JSON: the one-click form post. Fall through to the query string.
  }
  if (!email || !token) {
    email = req.nextUrl.searchParams.get('e') ?? ''
    token = req.nextUrl.searchParams.get('t') ?? ''
  }
  email = email.trim().toLowerCase()

  if (!verifyUnsubToken(email, token)) {
    return Response.json({ error: 'Invalid or expired link.' }, { status: 401 })
  }

  try {
    await deleteAlertPrefs(email)
    // Best effort: the alerts have already stopped at this point.
    await forgetAlertHistory(email).catch(e => console.error('forgetAlertHistory failed:', e))
    return Response.json({ ok: true })
  } catch (e) {
    console.error('Unsubscribe error:', e)
    return Response.json({ error: 'Could not unsubscribe. Please try again.' }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
