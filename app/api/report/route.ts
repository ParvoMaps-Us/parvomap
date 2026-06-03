import { NextRequest } from 'next/server'
import { ReportSchema } from '@/lib/report-schema'
import { calculateConfidence } from '@/lib/confidence'
import type { SOURCE_VALUES } from '@/lib/report-schema'
import { geocodeZip } from '@/lib/geocode'
import { isUtahZip } from '@/lib/utah-zips'
import {
  savePendingReport,
  queueDelayedEmail,
  type PendingReport,
} from '@/lib/redis'
import {
  generateVerificationToken,
  saveVerificationToken,
} from '@/lib/verification'
import { sendVerificationEmail } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ReportSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { disease, zip, email, source, breed, notes } = parsed.data

    const confidence = calculateConfidence({
      source: source as typeof SOURCE_VALUES[number] | undefined,
      hasEmail: !!email,
      hasNotes: !!notes,
    })

    // Geocode ZIP → lat/lng/city/state
    const geo = await geocodeZip(zip)

    const id = crypto.randomUUID()
    const report: PendingReport = {
      id,
      disease,
      zip,
      state:     geo?.state  ?? '',
      city:      geo?.city   ?? undefined,
      county:    geo?.county ?? undefined,
      lat:       geo?.lat    ?? undefined,
      lng:       geo?.lng    ?? undefined,
      email:     email || null,
      source:    source || undefined,
      breed:     breed || null,
      notes:     notes || undefined,
      confidence,
      verified:  false,
      timestamp: Date.now(),
    }

    // Persist pending report to Redis (25 h TTL)
    await savePendingReport(report)

    // Send verification email (non-blocking — don't fail the response if email fails)
    if (email) {
      const token = generateVerificationToken()
      await saveVerificationToken(token, id)
      sendVerificationEmail(report, token).catch(err =>
        console.error('Verification email failed:', err)
      )

      // Queue delayed BioRest outreach for Utah reporters
      if (isUtahZip(zip)) {
        queueDelayedEmail(id).catch(console.error)
      }
    }

    console.log('Report received:', { id, disease, zip, state: geo?.state, confidence })

    return Response.json({
      ok:        true,
      id,
      verified:  false,
      emailSent: !!email,
    })
  } catch (e) {
    console.error('Report POST error:', e)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
