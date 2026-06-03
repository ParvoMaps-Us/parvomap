import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

export interface Report {
  id: string
  disease: string
  zip: string
  state: string
  city?: string
  lat?: number
  lng?: number
  timestamp: number
  verified: boolean
  source?: string
  notes?: string
}

export async function getReports({ limit = 500 }: { limit?: number } = {}): Promise<Report[]> {
  const r = getRedis()
  // Verified reports stored as JSON strings in a sorted set (score = timestamp)
  const raw = await r.zrange('reports:verified', 0, limit - 1, { rev: true })
  return (raw as string[]).map(s => JSON.parse(s) as Report)
}

export async function getStats() {
  const reports = await getReports({ limit: 500 })
  const now = Date.now()
  const recent48 = reports.filter(r => now - r.timestamp < 48 * 60 * 60 * 1000)

  // Top disease in last 48h
  const diseaseCounts: Record<string, number> = {}
  recent48.forEach(r => { diseaseCounts[r.disease] = (diseaseCounts[r.disease] ?? 0) + 1 })
  const topDisease = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  // Top 3 states in last 48h
  const stateCounts: Record<string, number> = {}
  recent48.forEach(r => { if (r.state) stateCounts[r.state] = (stateCounts[r.state] ?? 0) + 1 })
  const topStates = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s)
    .join(', ')

  return {
    last30: reports.filter(r => now - r.timestamp < 30 * 24 * 60 * 60 * 1000).length,
    last7: reports.filter(r => now - r.timestamp < 7 * 24 * 60 * 60 * 1000).length,
    last48: recent48.length,
    states: new Set(reports.map(r => r.state).filter(Boolean)).size,
    topDisease,
    topStates,
  }
}
