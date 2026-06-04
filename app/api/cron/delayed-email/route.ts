import { getPendingReport, getRedisClient } from '@/lib/redis'
import { sendDelayedUtahOutreach } from '@/lib/notifications'

/**
 * Cron job — runs every 5 minutes via Vercel Cron.
 * Picks up delayed outreach emails queued for Utah reporters
 * and sends them when their fire_at timestamp has passed.
 *
 * Vercel cron config (vercel.json):
 *   { "path": "/api/cron/delayed-email", "schedule": "* /5 * * * *" }
 */
export async function GET(req: Request) {
  // Simple bearer token guard for the cron endpoint
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = (req as Request & { headers: Headers }).headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const client = getRedisClient()
  if (!client) {
    return Response.json({ error: 'Redis not configured' }, { status: 503 })
  }

  const now = Date.now()

  // Get all queued jobs with score (fire_at) <= now
  // Upstash SDK uses zrange with byScore option instead of zrangebyscore
  const due = await client.zrange('delayed-emails:queue', 0, now, {
    byScore: true,
  })

  if (!due || due.length === 0) {
    return Response.json({ processed: 0 })
  }

  let sent = 0
  let failed = 0

  for (const reportId of due as string[]) {
    try {
      const report = await getPendingReport(reportId)

      // If the pending report still exists, the reporter hasn't verified yet
      // (or verified — in which case the pending record was deleted, so report is null)
      // We send outreach regardless of verification status since it's a service offer
      if (report?.email) {
        await sendDelayedUtahOutreach(report)
        sent++
      }

      // Remove from queue regardless
      await client.zrem('delayed-emails:queue', reportId)
    } catch (e) {
      console.error(`Delayed email failed for report ${reportId}:`, e)
      failed++
      // Remove from queue so we don't retry infinitely
      await client.zrem('delayed-emails:queue', reportId)
    }
  }

  console.log(`Delayed email cron: sent=${sent} failed=${failed}`)
  return Response.json({ processed: due.length, sent, failed })
}
