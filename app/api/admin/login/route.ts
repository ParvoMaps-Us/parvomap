import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, signAdminSession, ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_MS } from '@/lib/magic-link'
import { isAdminEmail } from '@/lib/admin-auth'
import { consumeMagicToken } from '@/lib/magic-consume'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Interstitial rendered on GET. A mail scanner / link-safety prefetcher that
 *  follows the sign-in link only lands here — it does not submit the form, so
 *  the token stays unconsumed and no session is minted until a human clicks
 *  "Continue". That keeps the single-use token in the POST prefetch-safe. */
function confirmPage(email: string, exp: number, token: string): Response {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin sign in — ParvoMaps</title></head>
<body style="margin:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;color:#f0f0f0;">
  <div style="max-width:460px;margin:0 auto;padding:64px 24px;text-align:center;">
    <div style="margin-bottom:28px;">
      <span style="font-size:22px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#00ff88;">PARVO</span><span style="font-size:22px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#f0f0f0;">MAPS</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;">Admin sign in</h1>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 28px;">Click below to sign in to the moderation dashboard. This link is single-use.</p>
    <form method="post" action="/api/admin/login">
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

/** Step 2 of admin login (GET): validate the magic link and show a
 *  click-to-continue interstitial. Does NOT consume the token or set a cookie —
 *  a prefetch of the emailed link must not burn it or mint a session. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const email = (p.get('e') ?? '').trim().toLowerCase()
  const exp = Number(p.get('exp'))
  const token = p.get('t') ?? ''

  if (!verifyAdminToken(email, exp, token) || !isAdminEmail(email)) {
    return NextResponse.redirect(new URL('/admin/login?error=expired', req.url))
  }
  return confirmPage(email, exp, token)
}

/** POST: triggered by the user clicking "Continue". Rate-limited (this is where
 *  a session is actually minted), re-validates, burns the single-use token,
 *  then sets the 7-day session cookie and lands on a clean /admin URL. */
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 'admin-login', 10, '1 m')
  if (!rl.ok) {
    return NextResponse.redirect(new URL('/admin/login?error=expired', req.url), 303)
  }

  const form = await req.formData().catch(() => null)
  const email = String(form?.get('e') ?? '').trim().toLowerCase()
  const exp = Number(form?.get('exp'))
  const token = String(form?.get('t') ?? '')

  if (!verifyAdminToken(email, exp, token) || !isAdminEmail(email)) {
    return NextResponse.redirect(new URL('/admin/login?error=expired', req.url), 303)
  }

  // First redemption wins; a replayed link is rejected the same as an expired one.
  if (!(await consumeMagicToken(token, exp))) {
    return NextResponse.redirect(new URL('/admin/login?error=expired', req.url), 303)
  }

  const res = NextResponse.redirect(new URL('/admin', req.url), 303)
  res.cookies.set(ADMIN_SESSION_COOKIE, signAdminSession(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  })
  return res
}
