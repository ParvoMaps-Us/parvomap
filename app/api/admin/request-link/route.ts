import { NextRequest } from 'next/server'
import { isAdminEmail, checkAdminPassword } from '@/lib/admin-auth'
import { makeAdminToken } from '@/lib/magic-link'
import { sendAdminMagicLink } from '@/lib/notifications'
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit'
import { maskEmail } from '@/lib/log'

// Step 1 of admin login: email + password. Both must check out before a magic
// link is emailed; the response is identical either way so the endpoint can't
// be used to probe which emails or passwords are valid.
export async function POST(req: NextRequest) {
  // Tight cap — this guards password guessing, not just email volume.
  const rl = await checkRateLimit(req, 'admin-link', 5, '15 m')
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSeconds)
  }

  let email = ''
  let password = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '').trim().toLowerCase()
    password = String(body?.password ?? '')
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!process.env.ADMIN_EMAILS || !process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Admin login is not configured.' }, { status: 503 })
  }

  // Always run the password check (it's constant-time) so a wrong email and a
  // wrong password take the same path.
  const passOk = checkAdminPassword(password)
  if (isAdminEmail(email) && passOk) {
    const { exp, token } = makeAdminToken(email)
    // Use the request's OWN origin (Host-derived), not the client-settable
    // Origin header: a spoofed Origin would email the admin a link pointing at
    // an attacker's host. Admin lives on the deployment host (blocked on the
    // public domain), and Vercel routing constrains the Host to this project's
    // domains, so nextUrl.origin is the correct trusted value here.
    const origin = req.nextUrl.origin
    const url = `${origin}/api/admin/login?e=${encodeURIComponent(email)}&exp=${exp}&t=${token}`
    try {
      await sendAdminMagicLink(email, url)
    } catch (e) {
      console.error('Admin magic-link email failed:', e)
    }
  } else {
    console.warn('Failed admin login attempt for:', maskEmail(email))
  }

  return Response.json({ ok: true, message: 'If the details were correct, a sign-in link is on its way.' })
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
