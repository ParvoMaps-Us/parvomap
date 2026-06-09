import { NextRequest } from 'next/server'
import { del } from '@vercel/blob'
import { removeVerifiedById, clearFlag } from '@/lib/redis'
import { getAdminFromCookies } from '@/lib/admin-auth'

// Admin action: remove a flagged report from the map and delete its photo.
// Guarded by the admin session cookie (or the legacy ?key= during transition).
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  const session = await getAdminFromCookies()
  if (!session) {
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
    // Return to whichever moderation surface invoked the action.
    const dest = req.nextUrl.searchParams.get('from') === 'dashboard' ? '/dashboard' : '/admin'
    return Response.redirect(`${req.nextUrl.origin}${dest}`)
  } catch (e) {
    console.error('Admin remove error:', e)
    return new Response('Server error', { status: 500 })
  }
}
