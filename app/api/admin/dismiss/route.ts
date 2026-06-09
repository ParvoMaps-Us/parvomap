import { NextRequest } from 'next/server'
import { clearFlag } from '@/lib/redis'
import { getAdminFromCookies } from '@/lib/admin-auth'

// Admin action: dismiss a flag as a false alarm — clears the flag but leaves the
// report on the map. Guarded by the admin session cookie (or legacy ?key=).
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
    await clearFlag(id)
    const dest = req.nextUrl.searchParams.get('from') === 'dashboard' ? '/dashboard' : '/admin'
    return Response.redirect(`${req.nextUrl.origin}${dest}`)
  } catch (e) {
    console.error('Admin dismiss error:', e)
    return new Response('Server error', { status: 500 })
  }
}
