import { getVerifiedRaw, type Report } from '@/lib/redis'
import { getDiseaseName } from '@/lib/diseases'

const DAY = 24 * 60 * 60 * 1000

export interface Bucket { key: string; label: string; count: number }

export interface DashboardData {
  generatedAt: number
  disease: {
    total: number
    last48: number
    last7: number
    last30: number
    byDisease: Bucket[]
    byState: Bucket[]
    byCounty: Bucket[]
    byReporter: Bucket[]
    recent: Report[]
  }
  lost: {
    total: number
    last7: number
    last30: number
    owner: number
    sighting: number
    byState: Bucket[]
    recent: Report[]
  }
}

function tally(
  rows: Report[],
  keyOf: (r: Report) => string | undefined,
  labelOf: (key: string) => string = k => k,
): Bucket[] {
  const counts: Record<string, number> = {}
  for (const r of rows) {
    const k = keyOf(r)
    if (!k) continue
    counts[k] = (counts[k] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, label: labelOf(key), count }))
}

const REPORTER_LABELS: Record<string, string> = {
  individual: 'Individual',
  vet: 'Veterinarian',
  facility: 'Facility',
  news: 'News / media',
}

/** Region/topic filter for clinic-scoped views. All fields case-insensitive. */
export interface ReportFilter {
  state?: string
  county?: string
  city?: string
  /** Disease keys to include. Empty/undefined = all diseases. Only narrows
   *  disease reports; lost-dog reports are unaffected. */
  diseases?: string[]
}

/** Apply a filter to a list of reports. Empty filter passes everything. */
export function filterReports(rows: Report[], filter?: ReportFilter): Report[] {
  if (!filter) return rows
  const state = filter.state?.trim().toLowerCase()
  const county = filter.county?.trim().toLowerCase()
  const city = filter.city?.trim().toLowerCase()
  const diseases = filter.diseases?.map(d => d.trim().toLowerCase()).filter(Boolean)
  if (!state && !county && !city && (!diseases || diseases.length === 0)) return rows
  return rows.filter(r => {
    if (state && (r.state || '').toLowerCase() !== state) return false
    if (county && (r.county || '').toLowerCase() !== county) return false
    if (city && (r.city || '').toLowerCase() !== city) return false
    // Disease filter only applies to disease reports; lost dogs pass through.
    if (diseases && diseases.length > 0 && r.kind !== 'lost' && !diseases.includes((r.disease || '').toLowerCase())) return false
    return true
  })
}

/** Distinct states (and cities within an optional state) present in the data —
 *  powers the clinic filter dropdowns. */
export async function getFilterOptions(state?: string): Promise<{ states: string[]; counties: string[]; cities: string[] }> {
  const all = (await getVerifiedRaw(5000)).map(v => v.report)
  const states = [...new Set(all.map(r => r.state).filter(Boolean) as string[])].sort()
  const target = state?.trim().toLowerCase()
  const inState = all.filter(r => !target || (r.state || '').toLowerCase() === target)
  const counties = [...new Set(inState.map(r => r.county).filter(Boolean) as string[])].sort()
  const cities = [...new Set(inState.map(r => r.city).filter(Boolean) as string[])].sort()
  return { states, counties, cities }
}

/** Aggregate verified reports into disease + lost-dog dashboard views,
 *  optionally narrowed to a state/city region. */
export async function getDashboardData(filter?: ReportFilter): Promise<DashboardData> {
  const all = filterReports((await getVerifiedRaw(5000)).map(v => v.report), filter)
  const now = Date.now()
  const within = (r: Report, days: number) => now - r.timestamp < days * DAY

  const disease = all.filter(r => r.kind !== 'lost')
  const lost = all.filter(r => r.kind === 'lost')

  return {
    generatedAt: now,
    disease: {
      total:  disease.length,
      last48: disease.filter(r => now - r.timestamp < 2 * DAY).length,
      last7:  disease.filter(r => within(r, 7)).length,
      last30: disease.filter(r => within(r, 30)).length,
      byDisease:  tally(disease, r => r.disease, getDiseaseName),
      byState:    tally(disease, r => r.state || undefined),
      byCounty:   tally(disease, r => r.county || undefined),
      byReporter: tally(disease, r => r.reporterType, k => REPORTER_LABELS[k] ?? k),
      recent: disease.slice(0, 15),
    },
    lost: {
      total:    lost.length,
      last7:    lost.filter(r => within(r, 7)).length,
      last30:   lost.filter(r => within(r, 30)).length,
      owner:    lost.filter(r => r.lostKind === 'owner').length,
      sighting: lost.filter(r => r.lostKind === 'sighting').length,
      byState:  tally(lost, r => r.state || undefined),
      recent: lost.slice(0, 15),
    },
  }
}
