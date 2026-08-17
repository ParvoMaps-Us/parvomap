import { NextRequest } from 'next/server'
import {
  getPendingReport,
  deletePendingReport,
  publishVerifiedReport,
  getReports,
} from '@/lib/redis'
import {
  consumeVerificationToken,
  restoreVerificationToken,
} from '@/lib/verification'
import {
  sendVerificationConfirmation,
  sendInternalAlert,
  sendAlertNotification,
} from '@/lib/notifications'
import { findMatchingAlertEmails, isProClinic } from '@/lib/alerts'
import { isUtahZip } from '@/lib/utah-zips'
import { getLeadType } from '@/lib/lead'
import { BIOREST_ENABLED } from '@/lib/flags'
import { checkRateLimit } from '@/lib/ratelimit'

const SITE = 'https://www.parvomaps.us'

/** Rough haversine distance in miles between two lat/lng points */
function distanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return Response.redirect(`${SITE}/?verified=missing`)
  }

  // Per-IP limit to block token brute-forcing. Tokens are 122-bit UUIDs so
  // guessing is hopeless anyway, but this also caps the email fan-out a
  // replayed/scripted verify link can trigger. Generous enough for mail-client
  // link prefetchers plus a real click.
  const rl = await checkRateLimit(req, 'verify', 10, '1 m')
  if (!rl.ok) {
    return Response.redirect(`${SITE}/?verified=error`)
  }

  // Tracked outside the try so the catch can tell the two failure worlds
  // apart: token consumed but nothing published (restore it, the link must
  // keep working) vs published (never restore, a replay would re-publish).
  let reportId: string | null = null
  let published = false

  try {
    // 1. Atomically consume the token. A concurrent second request — mail
    //    scanner prefetch, double-click — gets null here and stops, instead of
    //    racing the whole flow and duplicating the emails below.
    reportId = await consumeVerificationToken(token)
    if (!reportId) {
      return Response.redirect(`${SITE}/?verified=expired`)
    }

    // 2. Fetch pending report
    const report = await getPendingReport(reportId)
    if (!report) {
      return Response.redirect(`${SITE}/?verified=expired`)
    }

    // 3. Tag reports from active Pro Clinic accounts so they carry a verified
    //    badge on the map/dashboard, then publish (strips PII — only the boolean
    //    flag survives, never the email used to derive it).
    if (report.email && (await isProClinic(report.email))) {
      report.verifiedClinic = true
    }
    await publishVerifiedReport(report)
    published = true

    // 4. Clean up the pending record (the token is already gone).
    await deletePendingReport(reportId)

    // 5. Count nearby verified reports (within 25 miles) for confirmation email
    let nearbyCount = 0
    if (report.lat && report.lng) {
      const allVerified = await getReports({ limit: 500 })
      nearbyCount = allVerified.filter(r => {
        if (!r.lat || !r.lng || r.id === report.id) return false
        return distanceMiles(report.lat!, report.lng!, r.lat, r.lng) <= 25
      }).length
    }

    // 6. Send follow-up emails non-blocking
    const emailJobs: Promise<void>[] = []

    if (report.email) {
      emailJobs.push(
        sendVerificationConfirmation(report, nearbyCount).catch(e =>
          console.error('Confirmation email failed:', e)
        )
      )

      // Notify Scoopie only for qualifying Utah leads (residential or
      // commercial), and only while the BioRest integration is live.
      if (BIOREST_ENABLED && isUtahZip(report.zip) && getLeadType(report)) {
        emailJobs.push(
          sendInternalAlert(report).catch(e =>
            console.error('Internal alert email failed:', e)
          )
        )
      }
    }

    // Subscriber alerts: notify paying members whose area + interests match this
    // newly published report. Excludes the reporter's own email. Best-effort —
    // a delivery failure must not break verification.
    try {
      const matchEmails = await findMatchingAlertEmails(report, report.email ?? undefined)
      for (const to of matchEmails) {
        emailJobs.push(
          sendAlertNotification(to, report).catch(e =>
            console.error('Alert notification failed:', to, e)
          )
        )
      }
    } catch (e) {
      console.error('Alert matching failed:', e)
    }

    // Await so the serverless function stays alive until the sends complete —
    // a fire-and-forget here gets frozen/dropped after the redirect returns.
    await Promise.allSettled(emailJobs)

    return Response.redirect(`${SITE}/?verified=success`)
  } catch (e) {
    console.error('Verify GET error:', e)
    // Token consumed but the report never published: put the token back so the
    // reporter's link still works on a retry. If it DID publish, leave the
    // token dead — restoring it would reopen the replay/duplicate-email hole
    // this flow just closed.
    if (reportId && !published) {
      await restoreVerificationToken(token, reportId).catch(err =>
        console.error('Token restore failed:', err)
      )
    }
    return Response.redirect(`${SITE}/?verified=error`)
  }
}
