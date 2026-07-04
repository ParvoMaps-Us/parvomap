import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken, signClinicSession, CLINIC_SESSION_COOKIE, CLINIC_SESSION_TTL_MS } from '@/lib/magic-link'
import { isProClinic } from '@/lib/alerts'
import { consumeMagicToken } from '@/lib/magic-consume'

export const dynamic = 'force-dynamic'

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Interstitial rendered on GET. A mail scanner / link-safety prefetcher that
 *  follows the email link only lands here — it does not submit the form, so the
 *  token stays unconsumed and no session is minted until a human clicks
 *  "Continue". That's what makes the single-use token in the POST prefetch-safe:
 *  the real user's link isn't burned before they ever arrive. */
function confirmPage(email: string, exp: number, token: string): Response {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in — ParvoMaps</title></head>
<body style="margin:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;color:#f0f0f0;">
  <div style="max-width:460px;margin:0 auto;padding:64px 24px;text-align:center;">
    <div style="margin-bottom:28px;">
      <span style="font-size:22px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#00ff88;">PARVO</span><span style="font-size:22px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#f0f0f0;">MAPS</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;">Sign in to your dashboard</h1>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 28px;">Click below to open your Pro Clinic dashboard. This link is single-use.</p>
    <form method="post" action="/api/clinic/login">
      <input type="hidden" name="e" value="${escAttr(email)}">
      <input type="hidden" name="exp" value="${escAttr(String(exp))}">
      <input type="hidden" name="t" value="${escAttr(token)}">
      <button type="submit" style="display:inline-block;background:#00ff88;color:#000;font-size:14px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border:none;cursor:pointer;padding:14px 32px;">Continue →</button>
    </form>
  </div>
</body>
</html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

/** GET: validate the magic link and show a click-to-continue interstitial.
 *  Deliberately does NOT consume the token or set a cookie — that happens in
 *  POST, so a prefetch can't burn the link or mint a session. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const email = (p.get('e') ?? '').trim().toLowerCase()
  const exp = Number(p.get('exp'))
  const token = p.get('t') ?? ''

  if (!verifyMagicToken(email, exp, token) || !(await isProClinic(email))) {
    return NextResponse.redirect(new URL('/clinic?error=expired', req.url))
  }
  return confirmPage(email, exp, token)
}

/** POST: triggered by the user clicking "Continue". Re-validates, burns the
 *  token (single-use), then mints the 30-day session cookie and redirects to a
 *  clean dashboard URL (no token in the address bar). */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const email = String(form?.get('e') ?? '').trim().toLowerCase()
  const exp = Number(form?.get('exp'))
  const token = String(form?.get('t') ?? '')

  if (!verifyMagicToken(email, exp, token) || !(await isProClinic(email))) {
    return NextResponse.redirect(new URL('/clinic?error=expired', req.url), 303)
  }

  // First redemption wins; a replayed link is rejected the same as an expired one.
  if (!(await consumeMagicToken(token, exp))) {
    return NextResponse.redirect(new URL('/clinic?error=expired', req.url), 303)
  }

  const res = NextResponse.redirect(new URL('/clinic/dashboard', req.url), 303)
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
