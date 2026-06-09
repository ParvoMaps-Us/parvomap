import { NextRequest } from 'next/server'
import { clearFlag } from '@/lib/redis'
import { getAdminFromCookies } from '@/lib/admin-auth'

// Admin action: dismiss a flag as a false alarm — clears the flag but leaves the
// report on the map. Guarded by the admin session cookie (or legacy ?key=).
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
    await clearFlag(id)
    const dest = req.nextUrl.searchParams.get('from') === 'dashboard' ? '/dashboard' : '/admin'
    const back = legacyKey ? `${dest}?key=${encodeURIComponent(key!)}` : dest
    return Response.redirect(`${req.nextUrl.origin}${back}`)
  } catch (e) {
    console.error('Admin dismiss error:', e)
    return new Response('Server error', { status: 500 })
  }
}
