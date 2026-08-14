import { NextResponse } from 'next/server'
import { geocodeZip } from '@/lib/geocode'

/**
 * ZIP → coordinates for the homepage "cases near me" search.
 *
 * Proxied through our own route rather than calling zippopotam from the browser
 * so the 24h fetch cache is shared across all visitors instead of being per-user,
 * and so a CORS or provider change is one file to fix rather than a client bug.
 */
export async function GET(req: Request) {
  const zip = new URL(req.url).searchParams.get('zip')?.trim() ?? ''
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Enter a 5-digit ZIP code.' }, { status: 400 })
  }

  const geo = await geocodeZip(zip)
  if (!geo) {
    return NextResponse.json({ error: `No US location found for ${zip}.` }, { status: 404 })
  }

  return NextResponse.json(
    { zip, ...geo },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
  )
}
