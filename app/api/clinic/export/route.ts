import { NextRequest } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { verifyMagicToken, readClinicSession, CLINIC_SESSION_COOKIE } from '@/lib/magic-link'
import { isProClinic } from '@/lib/alerts'
import { getVerifiedRaw } from '@/lib/redis'
import { filterReports, type ReportFilter } from '@/lib/dashboard'
import type { Report } from '@/lib/redis'

export const dynamic = 'force-dynamic'

// Public, non-PII columns. Email/breed/notes are never stored on verified
// reports, so there's nothing sensitive to leak here.
const COLUMNS: (keyof Report)[] = [
  'id', 'kind', 'disease', 'lostKind', 'state', 'county', 'city', 'zip', 'lat', 'lng',
  'reporterType', 'verifiedClinic', 'confidence', 'timestamp',
]

function csvCell(v: unknown): string {
  if (v == null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(rows: Report[]): string {
  const header = COLUMNS.join(',')
  const lines = rows.map(r =>
    COLUMNS.map(c => csvCell(c === 'timestamp' ? new Date(r.timestamp).toISOString() : r[c])).join(','),
  )
  return [header, ...lines].join('\n')
}

/** Authorize via (in priority order): a shared CLINIC_API_KEY (programmatic),
 *  the clinic session cookie (in-dashboard download), or a magic-link token. */
/** Constant-time compare of the shared API key. Hashing both sides first gives
 *  timingSafeEqual equal-length buffers and hides the real key's length. */
function apiKeyMatches(supplied: string | null): boolean {
  const expected = process.env.CLINIC_API_KEY
  if (!expected || !supplied) return false
  const a = createHash('sha256').update(supplied).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

async function authorize(p: URLSearchParams): Promise<boolean> {
  if (apiKeyMatches(p.get('key'))) return true

  const cookieStore = await cookies()
  const sessionEmail = readClinicSession(cookieStore.get(CLINIC_SESSION_COOKIE)?.value)
  if (sessionEmail && (await isProClinic(sessionEmail))) return true

  const email = (p.get('e') ?? '').trim().toLowerCase()
  const exp = Number(p.get('exp'))
  const token = p.get('t') ?? ''
  if (verifyMagicToken(email, exp, token) && (await isProClinic(email))) return true

  return false
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams

  if (!(await authorize(p))) {
    return Response.json({ error: 'Unauthorized — needs a valid Pro Clinic link or API key.' }, { status: 401 })
  }

  // `disease` may be repeated (?disease=parvo&disease=lyme) or comma-separated
  // (?disease=parvo,lyme). Empty = all diseases.
  const diseases = p.getAll('disease').flatMap(d => d.split(',')).map(d => d.trim()).filter(Boolean)

  const filter: ReportFilter = {
    state: p.get('state') ?? undefined,
    county: p.get('county') ?? undefined,
    city: p.get('city') ?? undefined,
    diseases,
  }

  const rows = filterReports((await getVerifiedRaw(5000)).map(v => v.report), filter)
  rows.sort((a, b) => b.timestamp - a.timestamp)

  const format = (p.get('format') ?? 'csv').toLowerCase()
  if (format === 'json') {
    return Response.json({ count: rows.length, reports: rows.map(r => Object.fromEntries(COLUMNS.map(c => [c, r[c]]))) })
  }

  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="parvomaps-cases-${stamp}.csv"`,
    },
  })
}
