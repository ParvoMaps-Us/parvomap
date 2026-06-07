import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken, signClinicSession, CLINIC_SESSION_COOKIE, CLINIC_SESSION_TTL_MS } from '@/lib/magic-link'
import { isProClinic } from '@/lib/alerts'

export const dynamic = 'force-dynamic'

/** Exchange a valid Pro Clinic magic link for a 30-day session cookie, then
 *  redirect to a clean dashboard URL (no token in the address bar). */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const email = (p.get('e') ?? '').trim().toLowerCase()
  const exp = Number(p.get('exp'))
  const token = p.get('t') ?? ''

  const ok = verifyMagicToken(email, exp, token) && (await isProClinic(email))
  if (!ok) {
    return NextResponse.redirect(new URL('/clinic?error=expired', req.url))
  }

  const res = NextResponse.redirect(new URL('/clinic/dashboard', req.url))
  res.cookies.set(CLINIC_SESSION_COOKIE, signClinicSession(email), {
    httpOnly: true,
    // Secure breaks on http://localhost; require it only in production (HTTPS).
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(CLINIC_SESSION_TTL_MS / 1000),
  })
  return res
}
