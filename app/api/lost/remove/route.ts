import { NextRequest } from 'next/server'
import { del } from '@vercel/blob'
import { getVerifiedRaw, removeVerifiedRaw, deletePendingReport } from '@/lib/redis'
import { verifyLostToken } from '@/lib/lost-token'

const SITE = 'https://www.parvomaps.us'

/**
 * Owner-initiated removal of a lost-dog post ("my dog was found"). Reached via a
 * signed link in the confirmation email: /api/lost/remove?id=<id>&t=<hmac>.
 * Takes the pin down immediately and deletes its uploaded photo.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const token = req.nextUrl.searchParams.get('t')

  if (!id || !token || !verifyLostToken(id, token)) {
    return Response.redirect(`${SITE}/?removed=invalid`)
  }

  try {
    const all = await getVerifiedRaw()
    const match = all.find(({ report }) => report.id === id && report.kind === 'lost')

    // Delete the photo if present (best-effort).
    if (match?.report.photoUrl && process.env.BLOB_READ_WRITE_TOKEN && /^https?:\/\//i.test(match.report.photoUrl)) {
      try { await del(match.report.photoUrl) } catch (e) { console.error('Blob delete failed:', e) }
    }

    if (match) await removeVerifiedRaw([match.raw])
    // Also drop any still-pending copy (e.g. removed before verifying).
    await deletePendingReport(id)

    return Response.redirect(`${SITE}/?removed=success`)
  } catch (e) {
    console.error('Lost remove error:', e)
    return Response.redirect(`${SITE}/?removed=error`)
  }
}
