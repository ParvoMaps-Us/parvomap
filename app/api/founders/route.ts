import { getFounderStatus } from '@/lib/founders'

// Live counter — must not be statically cached at build time.
export const dynamic = 'force-dynamic'

export async function GET() {
  const status = await getFounderStatus()
  return Response.json(status, {
    // Short shared-cache window: scarcity number can lag a few seconds, that's fine.
    headers: { 'Cache-Control': 'public, max-age=15, s-maxage=15' },
  })
}
