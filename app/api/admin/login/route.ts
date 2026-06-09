import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, signAdminSession, ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_MS } from '@/lib/magic-link'
import { isAdminEmail } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/** Step 2 of admin login: exchange a valid magic link for a 7-day session
 *  cookie, then land on a clean /admin URL (no token in the address bar). */
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, 'admin-login', 10, '1 m')
  if (!rl.ok) {
    return NextResponse.redirect(new URL('/admin/login?error=expired', req.url))
  }

  const p = req.nextUrl.searchParams
  const email = (p.get('e') ?? '').trim().toLowerCase()
  const exp = Number(p.get('exp'))
  const token = p.get('t') ?? ''

  if (!verifyAdminToken(email, exp, token) || !isAdminEmail(email)) {
    return NextResponse.redirect(new URL('/admin/login?error=expired', req.url))
  }

  const res = NextResponse.redirect(new URL('/admin', req.url))
  res.cookies.set(ADMIN_SESSION_COOKIE, signAdminSession(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  })
  return res
}
