import { NextRequest } from 'next/server'
import {
  getPendingReport,
  deletePendingReport,
  publishVerifiedReport,
  getReports,
} from '@/lib/redis'
import {
  getReportIdForToken,
  deleteVerificationToken,
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

  try {
    // 1. Look up reportId from token
    const reportId = await getReportIdForToken(token)
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

    // 4. Clean up pending record + token
    await Promise.all([
      deletePendingReport(reportId),
      deleteVerificationToken(token),
    ])

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
    return Response.redirect(`${SITE}/?verified=error`)
  }
}
