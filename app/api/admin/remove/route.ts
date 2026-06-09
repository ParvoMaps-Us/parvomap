import { NextRequest } from 'next/server'
import { del } from '@vercel/blob'
import { removeVerifiedById, clearFlag } from '@/lib/redis'
import { getAdminFromCookies } from '@/lib/admin-auth'

// Admin action: remove a flagged report from the map and delete its photo.
// Guarded by the admin session cookie (or the legacy ?key= during transition).
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  const id = req.nextUrl.searchParams.get('id')
  const adminKey = process.env.ADMIN_KEY

  const session = await getAdminFromCookies()
  const legacyKey = !!adminKey && key === adminKey
  if (!session && !legacyKey) {
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
    // Only propagate the key when it was the credential used; cookie sessions
    // get clean URLs.
    const back = legacyKey ? `${dest}?key=${encodeURIComponent(key!)}` : dest
    return Response.redirect(`${req.nextUrl.origin}${back}`)
  } catch (e) {
    console.error('Admin remove error:', e)
    return new Response('Server error', { status: 500 })
  }
}
