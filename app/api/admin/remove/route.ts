import { NextRequest } from 'next/server'
import { del } from '@vercel/blob'
import { removeVerifiedById, clearFlag } from '@/lib/redis'

// Admin action: remove a flagged report from the map and delete its photo.
// Guarded by ADMIN_KEY (same key that gates the /admin dashboard).
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  const id = req.nextUrl.searchParams.get('id')
  const adminKey = process.env.ADMIN_KEY

  if (!adminKey || key !== adminKey) {
    return new Response('Unauthorized', { status: 401 })
  }
  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  try {
    const removed = await removeVerifiedById(id)
    if (removed?.kind === 'lost' && removed.photoUrl && process.env.BLOB_READ_WRITE_TOKEN && /^https?:\/\//i.test(removed.photoUrl)) {
      try { await del(removed.photoUrl) } catch (e) { console.error('Blob delete failed:', e) }
    }
    await clearFlag(id)
    return Response.redirect(`${req.nextUrl.origin}/admin?key=${encodeURIComponent(key)}`)
  } catch (e) {
    console.error('Admin remove error:', e)
    return new Response('Server error', { status: 500 })
  }
}
