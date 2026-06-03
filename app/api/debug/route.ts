import { Redis } from '@upstash/redis'

export async function GET() {
  const url   = process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  try {
    const client = new Redis({ url: url!, token: token! })
    await client.set('debug-test', 'ok', { ex: 60 })
    const val = await client.get('debug-test')
    return Response.json({ ok: true, val, url: url?.slice(0, 30), tokenPrefix: token?.slice(0, 12) })
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message, url: url?.slice(0, 30), tokenPrefix: token?.slice(0, 12) })
  }
}
