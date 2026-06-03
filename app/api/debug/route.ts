export async function GET() {
  return Response.json({
    UPSTASH_REDIS_REST_URL:    process.env.UPSTASH_REDIS_REST_URL?.slice(0, 30) ?? 'MISSING',
    UPSTASH_REDIS_REST_TOKEN:  process.env.UPSTASH_REDIS_REST_TOKEN?.slice(0, 10) ?? 'MISSING',
    KV_REST_API_URL:           process.env.KV_REST_API_URL?.slice(0, 30) ?? 'MISSING',
    KV_REST_API_TOKEN:         process.env.KV_REST_API_TOKEN?.slice(0, 10) ?? 'MISSING',
    KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_READ_ONLY_TOKEN?.slice(0, 10) ?? 'MISSING',
    REDIS_URL:                 process.env.REDIS_URL?.slice(0, 30) ?? 'MISSING',
    RESEND_API_KEY:            process.env.RESEND_API_KEY?.slice(0, 10) ?? 'MISSING',
  })
}
