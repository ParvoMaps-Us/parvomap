import { del } from '@vercel/blob'
import { getVerifiedRaw, removeVerifiedRaw } from '@/lib/redis'
import { isExpired } from '@/lib/retention'

/**
 * Cron job — runs daily via Vercel Cron.
 * Enforces the retention policy: removes expired pins from the verified set and
 * deletes any uploaded lost-dog photo from Blob so storage doesn't grow forever.
 *
 * Vercel cron config (vercel.json):
 *   { "path": "/api/cron/cleanup", "schedule": "0 4 * * *" }
 */
export async function GET(req: Request) {
  // Bearer-token guard (same pattern as the delayed-email cron).
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = Date.now()
  const all = await getVerifiedRaw()
  const expired = all.filter(({ report }) => isExpired(report, now))

  if (expired.length === 0) {
    return Response.json({ ok: true, removed: 0, photosDeleted: 0 })
  }

  // Delete the uploaded photos first (best-effort — never block removal on a
  // blob delete failure). Only our own Blob URLs are deletable.
  let photosDeleted = 0
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const urls = expired
      .map(({ report }) => report.photoUrl)
      .filter((u): u is string => !!u && /^https?:\/\//i.test(u))
    for (const url of urls) {
      try {
        await del(url)
        photosDeleted++
      } catch (e) {
        console.error('Blob delete failed for', url, e)
      }
    }
  }

  const removed = await removeVerifiedRaw(expired.map(e => e.raw))

  console.log('Cleanup:', { removed, photosDeleted, scanned: all.length })
  return Response.json({ ok: true, removed, photosDeleted })
}
