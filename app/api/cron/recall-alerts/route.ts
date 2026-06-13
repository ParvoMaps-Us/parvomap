import { getPetFoodRecalls, archiveRecalls, matchBrand } from '@/lib/recalls'
import {
  getAllAlertPrefs,
  isActiveSubscriber,
  wasRecallAlerted,
  markRecallAlerted,
} from '@/lib/alerts'
import { sendRecallAlert } from '@/lib/notifications'
import { maskEmail } from '@/lib/log'

/**
 * Cron job — checks current FDA pet-food recalls against each paying
 * subscriber's registered dog-food brands and emails a one-time alert when a
 * brand matches. Deduped via the recall_alerts_sent set so a recall is never
 * emailed twice to the same person.
 *
 * Scheduled in vercel.json to run every 6 hours, matching the recall cache TTL.
 */
export async function GET(req: Request) {
  // Bearer-token guard (same pattern as the other crons).
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const recalls = await getPetFoodRecalls()

  // Persist every recall we see so the list page keeps history and each gets a
  // durable detail page after it ages out of the FDA feed.
  await archiveRecalls(recalls)

  if (recalls.length === 0) {
    return Response.json({ ok: true, sent: 0, reason: 'no current pet-food recalls' })
  }

  const prefs = (await getAllAlertPrefs()).filter(p => p.foodBrands && p.foodBrands.length > 0)

  let sent = 0
  for (const p of prefs) {
    // Recall alerts are a paid perk — re-check the live subscription.
    if (!(await isActiveSubscriber(p.email))) continue

    for (const recall of recalls) {
      const brand = matchBrand(recall, p.foodBrands ?? [])
      if (!brand) continue
      if (await wasRecallAlerted(p.email, recall.url)) continue
      try {
        await sendRecallAlert(p.email, brand, recall)
        await markRecallAlerted(p.email, recall.url)
        sent++
      } catch (e) {
        console.error('Recall alert send failed:', maskEmail(p.email), recall.url, e)
      }
    }
  }

  return Response.json({ ok: true, sent, recalls: recalls.length, subscribersChecked: prefs.length })
}
