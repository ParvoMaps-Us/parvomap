import { NextRequest } from 'next/server'
import { ReportSchema } from '@/lib/report-schema'
import { calculateConfidence } from '@/lib/confidence'
import type { SOURCE_VALUES } from '@/lib/report-schema'

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

    const id = crypto.randomUUID()
    const report = {
      id,
      disease,
      zip,
      email: email || null,
      source: source || null,
      breed: breed || null,
      notes: notes || null,
      confidence,
      verified: false,
      timestamp: Date.now(),
    }

    // TODO: store to Redis pending queue + send verification email
    // For now return success — will wire in next session
    console.log('Report received:', { id, disease, zip, confidence })

    return Response.json({ ok: true, id })
  } catch (e) {
    console.error('Report POST error:', e)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
