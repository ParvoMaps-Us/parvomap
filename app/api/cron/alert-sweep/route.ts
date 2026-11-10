import { sweepNewReports } from '@/lib/alert-delivery'

/**
 * Cron job, hourly (vercel.json). Emails alert signups about pins that reached
 * the map without going through /api/verify, which today means the seeded cases
 * from the weekly disease scan. The first run only records the pins already on
 * the map and sends nothing.
 *
 * Fails CLOSED: without CRON_SECRET this route refuses to run, because it sends
 * email. (Vercel sets the Authorization header on its own cron calls.)
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await sweepNewReports()
    console.log('Alert sweep:', res)
    return Response.json({ ok: true, ...res })
  } catch (e) {
    console.error('Alert sweep failed:', e)
    return Response.json({ error: 'Sweep failed' }, { status: 500 })
  }
}
