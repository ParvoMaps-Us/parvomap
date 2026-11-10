import { getPetFoodRecalls, archiveRecalls, matchBrand, isFoodRecall } from '@/lib/recalls'
import {
  getAllAlertPrefs,
  isActiveSubscriber,
  isConfirmedFree,
  wasRecallAlerted,
  markRecallAlerted,
} from '@/lib/alerts'
import { sendRecallAlert, sendFreeRecallAlert } from '@/lib/notifications'
import { getRedisClient } from '@/lib/redis'
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

  const allPrefs = await getAllAlertPrefs()
  const freeSent = await sendFreeRecallAlerts(recalls, allPrefs)

  const prefs = allPrefs.filter(p => p.tier !== 'free' && p.foodBrands && p.foodBrands.length > 0)

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

  return Response.json({ ok: true, sent, freeSent, recalls: recalls.length, subscribersChecked: prefs.length })
}

const RECALL_SEEN_SET = 'recall_seen_urls'
const RECALL_BOOT_KEY = 'recall_seen:bootstrapped'

/**
 * Free tier: email each confirmed free signup about pet-FOOD recalls that are
 * new since the last run (no brand matching; vet drugs and devices are left
 * out). "New" is tracked globally by recall URL. The first run only records
 * what the FDA feed already holds, so nobody is emailed a backlog, and a person
 * who signs up today only hears about recalls posted after today.
 */
async function sendFreeRecallAlerts(
  recalls: Awaited<ReturnType<typeof getPetFoodRecalls>>,
  allPrefs: Awaited<ReturnType<typeof getAllAlertPrefs>>,
): Promise<number> {
  const client = getRedisClient()
  if (!client) return 0
  try {
    const food = recalls.filter(r => r.url && isFoodRecall(r))
    if (food.length === 0) return 0

    const booted = await client.get(RECALL_BOOT_KEY)
    const seen = new Set((await client.smembers(RECALL_SEEN_SET)) as string[])
    const fresh = food.filter(r => !seen.has(r.url))
    if (fresh.length > 0) await client.sadd(RECALL_SEEN_SET, fresh[0].url, ...fresh.slice(1).map(r => r.url))
    if (!booted) {
      await client.set(RECALL_BOOT_KEY, String(Date.now()))
      return 0
    }
    // A feed that re-keys its URLs would make everything look new. Never email
    // more than a handful in one run.
    if (fresh.length === 0 || fresh.length > 5) {
      if (fresh.length > 5) console.warn('Free recall alerts skipped: too many new recalls at once:', fresh.length)
      return 0
    }

    let sent = 0
    for (const p of allPrefs) {
      if (!isConfirmedFree(p) || p.recalls === false) continue
      const mine = []
      for (const r of fresh) if (!(await wasRecallAlerted(p.email, r.url))) mine.push(r)
      if (mine.length === 0) continue
      try {
        await sendFreeRecallAlert(p.email, mine)
        for (const r of mine) await markRecallAlerted(p.email, r.url)
        sent++
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('Free recall alert send failed:', maskEmail(p.email), msg.split(p.email).join(maskEmail(p.email)).slice(0, 300))
      }
    }
    return sent
  } catch (e) {
    console.error('Free recall alerts failed:', e)
    return 0
  }
}
