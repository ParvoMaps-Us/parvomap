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

/** Aggregate every verified report into disease + lost-dog dashboard views. */
export async function getDashboardData(): Promise<DashboardData> {
  const all = (await getVerifiedRaw(5000)).map(v => v.report)
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
