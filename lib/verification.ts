import { Redis } from '@upstash/redis'

const TOKEN_TTL_SECONDS = 60 * 60 * 24 // 24 hours

function getClient() {
  return new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

export function generateVerificationToken(): string {
  return crypto.randomUUID()
}

/** Store token → reportId mapping for 24 h */
export async function saveVerificationToken(
  token: string,
  reportId: string
): Promise<void> {
  const client = getClient()
  await client.set(`verify:token:${token}`, reportId, { ex: TOKEN_TTL_SECONDS })
}

/** Look up which reportId a token belongs to. Returns null if expired/missing. */
export async function getReportIdForToken(token: string): Promise<string | null> {
  const client = getClient()
  return client.get<string>(`verify:token:${token}`)
}

/** Delete a token after it has been consumed */
export async function deleteVerificationToken(token: string): Promise<void> {
  const client = getClient()
  await client.del(`verify:token:${token}`)
}
