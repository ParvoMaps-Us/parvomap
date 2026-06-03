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

    // Send verification email (don't fail the response if email fails)
    let emailSent = false
    let emailError: string | undefined // TODO: debug only — remove once email is confirmed working
    if (email) {
      const token = generateVerificationToken()
      await saveVerificationToken(token, id)

      // Await the send so the serverless function stays alive until Resend
      // responds — a fire-and-forget promise gets frozen/dropped after the
      // response returns on Vercel, silently swallowing the email.
      try {
        await sendVerificationEmail(report, token)
        emailSent = true
      } catch (err) {
        emailError = err instanceof Error ? err.message : String(err)
        console.error('Verification email failed:', err)
      }

      // Queue delayed BioRest outreach for Utah reporters
      if (isUtahZip(zip)) {
        try {
          await queueDelayedEmail(id)
        } catch (err) {
          console.error('Failed to queue delayed email:', err)
        }
      }
    }

    console.log('Report received:', { id, disease, zip, state: geo?.state, confidence, emailSent })

    return Response.json({
      ok:        true,
      id,
      verified:  false,
      emailSent,
      ...(emailError ? { emailError } : {}), // TODO: debug only — remove once email is confirmed working
    })
  } catch (e) {
    console.error('Report POST error:', e)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
