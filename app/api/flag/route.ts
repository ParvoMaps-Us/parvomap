import { NextRequest } from 'next/server'
import { z } from 'zod'
import { addFlag, getVerifiedRaw } from '@/lib/redis'

// Allow flagging from either canonical host (same as the report endpoint).
const ALLOWED_ORIGINS = new Set(['https://parvomaps.us', 'https://www.parvomaps.us'])

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
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

const FlagSchema = z.object({
  id:     z.string().min(1).max(100),
  reason: z.string().max(200).optional(),
})

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req.headers.get('origin'))
  try {
    const parsed = FlagSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request' }, { status: 400, headers: cors })
    }
    const { id, reason } = parsed.data

    // Only allow flagging a report that actually exists on the map. This also
    // lets us build a readable summary for the moderation dashboard.
    const match = (await getVerifiedRaw()).find(({ report }) => report.id === id)
    if (!match) {
      return Response.json({ error: 'Report not found' }, { status: 404, headers: cors })
    }

    const r = match.report
    const where = r.zip ? `ZIP ${r.zip}` : (r.address || r.city || r.state || 'unknown')
    const summary = r.kind === 'lost'
      ? `Lost dog${r.dogName ? ` "${r.dogName}"` : ''} — ${where}`
      : `${r.disease} — ${where}`

    const count = await addFlag(id, reason?.trim() ?? '', summary)
    return Response.json({ ok: true, count }, { headers: cors })
  } catch (e) {
    console.error('Flag POST error:', e)
    return Response.json({ error: 'Server error' }, { status: 500, headers: cors })
  }
}
