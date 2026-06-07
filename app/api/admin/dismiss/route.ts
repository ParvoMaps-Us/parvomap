import { NextRequest } from 'next/server'
import { clearFlag } from '@/lib/redis'

// Admin action: dismiss a flag as a false alarm — clears the flag but leaves the
// report on the map. Guarded by ADMIN_KEY.
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
    await clearFlag(id)
    const dest = req.nextUrl.searchParams.get('from') === 'dashboard' ? '/dashboard' : '/admin'
    return Response.redirect(`${req.nextUrl.origin}${dest}?key=${encodeURIComponent(key)}`)
  } catch (e) {
    console.error('Admin dismiss error:', e)
    return new Response('Server error', { status: 500 })
  }
}
