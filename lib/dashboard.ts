import { getVerifiedRaw, type Report } from '@/lib/redis'
import { getDiseaseName } from '@/lib/diseases'
import { CLINIC_DEMO, demoReports } from '@/lib/demo-data'

const DAY = 24 * 60 * 60 * 1000

/** Verified reports for dashboard views. In demo mode (CLINIC_DEMO=1) we serve
 *  synthetic data so previews render without Redis; otherwise read live Redis. */
async function dashboardReports(limit = 5000): Promise<Report[]> {
  if (CLINIC_DEMO) return demoReports().slice(0, limit)
  return (await getVerifiedRaw(limit)).map(v => v.report)
}

export interface Bucket { key: string; label: string; count: number }

/** One day of the case-count time series. `date` is an ISO yyyy-mm-dd (UTC). */
export interface TrendPoint { date: string; count: number }

/** One disease's case-count time series, for overlaying on the trend chart. */
export interface TrendSeries { key: string; label: string; points: TrendPoint[] }

/** The yyyy-mm-dd (UTC) keys for the last `days` days, oldest first. */
function dayKeys(days: number, now: number): string[] {
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) out.push(new Date(now - i * DAY).toISOString().slice(0, 10))
  return out
}

/** Daily case counts for the last `days` days, oldest first. Days with no
 *  reports are included as zeros so the chart x-axis stays evenly spaced. */
function dailyTrend(rows: Report[], days: number): TrendPoint[] {
  const now = Date.now()
  const counts: Record<string, number> = {}
  const cutoff = now - days * DAY
  for (const r of rows) {
    if (r.timestamp < cutoff) continue
    const key = new Date(r.timestamp).toISOString().slice(0, 10)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return dayKeys(days, now).map(key => ({ date: key, count: counts[key] ?? 0 }))
}

/** Per-disease daily series for the top `limit` diseases (by total volume),
 *  for overlaying as separate lines on the trend chart. */
function dailyTrendByDisease(rows: Report[], days: number, limit: number): TrendSeries[] {
  const now = Date.now()
  const cutoff = now - days * DAY
  const inWindow = rows.filter(r => r.timestamp >= cutoff)
  const top = tally(inWindow, r => r.disease, getDiseaseName).slice(0, limit)
  const keys = dayKeys(days, now)
  return top.map(({ key, label }) => {
    const counts: Record<string, number> = {}
    for (const r of inWindow) {
      if (r.disease !== key) continue
      const day = new Date(r.timestamp).toISOString().slice(0, 10)
      counts[day] = (counts[day] ?? 0) + 1
    }
    return { key, label, points: keys.map(d => ({ date: d, count: counts[d] ?? 0 })) }
  })
}

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
    trend: TrendPoint[]
    trendByDisease: TrendSeries[]
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
  const all = await dashboardReports()
  const states = [...new Set(all.map(r => r.state).filter(Boolean) as string[])].sort()
  const target = state?.trim().toLowerCase()
  const inState = all.filter(r => !target || (r.state || '').toLowerCase() === target)
  const counties = [...new Set(inState.map(r => r.county).filter(Boolean) as string[])].sort()
  const cities = [...new Set(inState.map(r => r.city).filter(Boolean) as string[])].sort()
  return { states, counties, cities }
}

export interface DiseaseStats {
  total: number
  last7: number
  last30: number
  byState: Bucket[]
  recent: Report[]
}

/** Live stats for a single disease key, pulled from verified reports. */
export async function getDiseaseStats(diseaseKey: string): Promise<DiseaseStats> {
  const all = (await getVerifiedRaw(5000)).map(v => v.report)
  const rows = all.filter(r => r.kind !== 'lost' && r.disease === diseaseKey)
  const now = Date.now()
  const within = (r: Report, days: number) => now - r.timestamp < days * DAY
  return {
    total: rows.length,
    last7: rows.filter(r => within(r, 7)).length,
    last30: rows.filter(r => within(r, 30)).length,
    byState: tally(rows, r => r.state || undefined),
    recent: rows.slice(0, 10),
  }
}

/** Total verified case count per disease key — powers the index page badges. */
export async function getDiseaseCounts(): Promise<Record<string, number>> {
  const all = (await getVerifiedRaw(5000)).map(v => v.report)
  const counts: Record<string, number> = {}
  for (const r of all) {
    if (r.kind === 'lost') continue
    counts[r.disease] = (counts[r.disease] ?? 0) + 1
  }
  return counts
}

/** Aggregate verified reports into disease + lost-dog dashboard views,
 *  optionally narrowed to a state/city region. */
export async function getDashboardData(filter?: ReportFilter): Promise<DashboardData> {
  const all = filterReports(await dashboardReports(), filter)
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
      trend: dailyTrend(disease, 365),
      trendByDisease: dailyTrendByDisease(disease, 365, 6),
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
