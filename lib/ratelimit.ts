import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

// The shared client in lib/redis.ts disables automaticDeserialization, which
// breaks @upstash/ratelimit (its Lua scripts expect default parsing). Use a
// separate client with default settings; they share the same Upstash database.
let redis: Redis | null = null
function getRatelimitRedis(): Redis | null {
  if (redis) return redis
  const isReal = (v?: string) => !!v && !v.includes('placeholder')
  const url   = isReal(process.env.UPSTASH_REDIS_REST_URL)   ? process.env.UPSTASH_REDIS_REST_URL   : process.env.KV_REST_API_URL
  const token = isReal(process.env.UPSTASH_REDIS_REST_TOKEN) ? process.env.UPSTASH_REDIS_REST_TOKEN : process.env.KV_REST_API_TOKEN
  if (!url || !token || url.includes('placeholder') || token.includes('placeholder')) return null
  redis = new Redis({ url, token })
  return redis
}

const limiters = new Map<string, Ratelimit>()

function getLimiter(name: string, limit: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`): Ratelimit | null {
  const key = `${name}:${limit}:${window}`
  const existing = limiters.get(key)
  if (existing) return existing
  const client = getRatelimitRedis()
  if (!client) return null
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `ratelimit:${name}`,
    analytics: false,
  })
  limiters.set(key, limiter)
  return limiter
}

/** Client IP for rate-limit keying. On Vercel, x-forwarded-for's first entry
 *  is set by the platform and is trustworthy. */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export interface RateLimitResult {
  ok: boolean
  /** Seconds until the window resets — for the Retry-After header */
  retryAfterSeconds: number
}

/** Check a named per-IP rate limit. Fails open (allows the request) when Redis
 *  is unconfigured or the check itself errors — availability over strictness
 *  for a public health-reporting tool. */
export async function checkRateLimit(
  req: NextRequest,
  name: string,
  limit: number,
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, limit, window)
  if (!limiter) return { ok: true, retryAfterSeconds: 0 }
  try {
    const { success, reset } = await limiter.limit(clientIp(req))
    return {
      ok: success,
      retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    }
  } catch (e) {
    console.error(`Rate limit check failed (${name}):`, e)
    return { ok: true, retryAfterSeconds: 0 }
  }
}

/** Standard 429 response */
export function rateLimitResponse(
  retryAfterSeconds: number,
  extraHeaders: Record<string, string> = {}
): Response {
  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds), ...extraHeaders },
    }
  )
}
