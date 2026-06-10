import { NextRequest, NextResponse } from 'next/server'

// Per-request nonce CSP. Generating the nonce here (not in next.config.ts) lets
// us drop 'unsafe-inline' and 'unsafe-eval' from script-src: Next.js reads the
// nonce from the request's CSP header and stamps it onto its own hydration
// scripts, and 'strict-dynamic' lets those scripts load their chunks. We have no
// third-party JS, so nothing else needs allowing.
//
// style-src keeps 'unsafe-inline' on purpose — Leaflet renders map popups as
// HTML strings with inline style="" attributes, which a nonce can't cover.
export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Dev only: Next.js React Refresh / HMR compiles with eval, so the dev server
  // needs 'unsafe-eval'. Production stays strict (nonce + strict-dynamic only).
  const devEval = process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devEval}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://unpkg.com https://*.tile.openstreetmap.org https://*.public.blob.vercel-storage.com",
    "connect-src 'self' https://parvomaps.us https://www.parvomaps.us https://*.basemaps.cartocdn.com https://geocoding.geo.census.gov https://photon.komoot.io https://api.zippopotam.us https://*.upstash.io https://*.resend.com",
    "worker-src blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

  // Pass the nonce + CSP forward on the request so Next.js can apply the nonce
  // to its inline scripts, and surface the nonce to server components via header.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  res.headers.set('Content-Security-Policy', csp)
  return res
}

export const config = {
  // Run on pages, not on static assets, the image optimizer, or favicon —
  // those don't execute our scripts and don't need a nonce.
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
