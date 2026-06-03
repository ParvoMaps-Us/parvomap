import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (
    !url || !token ||
    url.includes('placeholder') ||
    token.includes('placeholder')
  ) {
    console.warn('Redis not configured — using null client')
    return null
  }

  try {
    redis = new Redis({ url, token })
    return redis
  } catch (e) {
    console.error('Redis init failed:', e)
    return null
  }
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

const EMPTY_STATS = {
  last30: 0, last7: 0, last48: 0, states: 0,
  topDisease: '', topStates: '',
}

export async function getReports({ limit = 500 }: { limit?: number } = {}): Promise<Report[]> {
  const client = getRedisClient()
  if (!client) return []

  try {
    const raw = await client.zrange('reports:verified', 0, limit - 1, { rev: true })
    return (raw as string[]).map(s => JSON.parse(s) as Report)
  } catch (e) {
    console.error('getReports error:', e)
    return []
  }
}

export async function getStats() {
  const client = getRedisClient()
  if (!client) return EMPTY_STATS

  try {
    const reports = await getReports({ limit: 500 })
    const now = Date.now()
    const recent48 = reports.filter(r => now - r.timestamp < 48 * 60 * 60 * 1000)

    const diseaseCounts: Record<string, number> = {}
    recent48.forEach(r => { diseaseCounts[r.disease] = (diseaseCounts[r.disease] ?? 0) + 1 })
    const topDisease = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

    const stateCounts: Record<string, number> = {}
    recent48.forEach(r => { if (r.state) stateCounts[r.state] = (stateCounts[r.state] ?? 0) + 1 })
    const topStates = Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s)
      .join(', ')

    return {
      last30: reports.filter(r => now - r.timestamp < 30 * 24 * 60 * 60 * 1000).length,
      last7:  reports.filter(r => now - r.timestamp < 7  * 24 * 60 * 60 * 1000).length,
      last48: recent48.length,
      states: new Set(reports.map(r => r.state).filter(Boolean)).size,
      topDisease,
      topStates,
    }
  } catch (e) {
    console.error('getStats error:', e)
    return EMPTY_STATS
  }
}
