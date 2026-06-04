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
} from '@/lib/notifications'
import { isUtahZip } from '@/lib/utah-zips'
import { getLeadType } from '@/lib/lead'

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

    // 3. Publish to verified sorted set (strips PII)
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
      // commercial). Vets and sighting-only reports generate no lead.
      if (isUtahZip(report.zip) && getLeadType(report)) {
        emailJobs.push(
          sendInternalAlert(report).catch(e =>
            console.error('Internal alert email failed:', e)
          )
        )
      }
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
