import { getRedisClient } from './redis'

const TOKEN_TTL_SECONDS = 60 * 60 * 24 // 24 hours

export function generateVerificationToken(): string {
  return crypto.randomUUID()
}

/** Store token → reportId mapping for 24 h */
export async function saveVerificationToken(
  token: string,
  reportId: string
): Promise<void> {
  const client = getRedisClient()
  if (!client) throw new Error('Redis not configured')
  await client.set(`verify:token:${token}`, reportId, { ex: TOKEN_TTL_SECONDS })
}

/** Look up which reportId a token belongs to. Returns null if expired/missing. */
export async function getReportIdForToken(token: string): Promise<string | null> {
  const client = getRedisClient()
  if (!client) return null
  return client.get<string>(`verify:token:${token}`)
}

/** Delete a token after it has been consumed */
export async function deleteVerificationToken(token: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.del(`verify:token:${token}`)
}
