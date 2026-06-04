import { NextRequest } from 'next/server'
import { ReportSchema } from '@/lib/report-schema'
import { calculateConfidence } from '@/lib/confidence'
import type { SOURCE_VALUES } from '@/lib/report-schema'
import { geocodeZip } from '@/lib/geocode'
import { isUtahZip } from '@/lib/utah-zips'
import { getsReporterOutreach } from '@/lib/lead'
import { parseCoordinates } from '@/lib/coords'
import { BIOREST_ENABLED } from '@/lib/flags'
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

// Allow the form to POST from either canonical host. Without this, a page
// loaded on the bare apex (parvomaps.us) that posts to /api/report gets a
// 308 redirect to www — a cross-origin redirect the browser silently blocks,
// so the report never reaches the server. Reflect known origins instead.
const ALLOWED_ORIGINS = new Set([
  'https://parvomaps.us',
  'https://www.parvomaps.us',
])

function corsHeaders(origin: string | null): Record<string, string> {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return {
      'Access-Control-Allow-Origin':  origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary':                         'Origin',
    }
  }
  return {}
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status:  204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req.headers.get('origin'))
  try {
    const body = await req.json()
    const parsed = ReportSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400, headers: cors })
    }

    const { disease, zip, reporterType, sighting, email, source, breed, notes, locationDetail, locationLat, locationLng, sourceUrl } = parsed.data

    const confidence = calculateConfidence({
      source: source as typeof SOURCE_VALUES[number] | undefined,
      reporterType,
      sighting,
      hasEmail: !!email,
      hasNotes: !!notes,
    })

    // Geocode ZIP → lat/lng/city/state
    const geo = await geocodeZip(zip)

    // Pin precision, in priority order:
    //   1. Coordinates from a picked autocomplete place (locationLat/Lng)
    //   2. Coordinates typed into the location field ("…, 40.34, -111.73")
    //   3. ZIP centroid
    const coords =
      (locationLat != null && locationLng != null)
        ? { lat: locationLat, lng: locationLng }
        : parseCoordinates(locationDetail)

    const id = crypto.randomUUID()
    const report: PendingReport = {
      id,
      disease,
      zip,
      state:     geo?.state  ?? '',
      city:      geo?.city   ?? undefined,
      county:    geo?.county ?? undefined,
      lat:       coords?.lat ?? geo?.lat ?? undefined,
      lng:       coords?.lng ?? geo?.lng ?? undefined,
      email:     email || null,
      source:    source || undefined,
      breed:     breed || null,
      notes:     notes || undefined,
      reporterType,
      sighting,
      locationDetail: locationDetail || undefined,
      sourceUrl: sourceUrl || undefined,
      confidence,
      verified:  false,
      timestamp: Date.now(),
    }

    // Persist pending report to Redis (25 h TTL)
    await savePendingReport(report)

    // Send verification email (don't fail the response if email fails)
    let emailSent = false
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
        console.error('Verification email failed:', err)
      }

      // Queue delayed BioRest outreach — only for Utah residential leads
      // (an individual whose own dog is affected), and only while the Scoopie
      // BioRest integration is live. Vets, facilities, and sighting-only
      // reports don't get the automated "your yard" pitch.
      if (BIOREST_ENABLED && isUtahZip(zip) && getsReporterOutreach(report)) {
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
    }, { headers: cors })
  } catch (e) {
    console.error('Report POST error:', e)
    return Response.json({ error: 'Server error' }, { status: 500, headers: cors })
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
