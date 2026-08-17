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

/**
 * Atomically consume a token and return its reportId, or null if expired,
 * missing, or already consumed.
 *
 * GETDEL rather than GET: the verify route used to read the token here and not
 * delete it until after the whole publish flow, several Redis round trips
 * later. Inside that window a second request — a mail-client safe-link
 * prefetch racing the real click, or a user double-click — passed every check
 * and re-ran the publish, sending duplicate confirmation/alert emails. With a
 * consuming read the second request dies right here with null.
 *
 * If the flow fails AFTER consuming but before the report is published, the
 * caller must restoreVerificationToken so the reporter's link still works.
 */
export async function consumeVerificationToken(token: string): Promise<string | null> {
  const client = getRedisClient()
  if (!client) return null
  return client.getdel<string>(`verify:token:${token}`)
}

/** Put a consumed token back (fresh 24 h TTL). Only for the failure path where
 *  the report never published — otherwise the link would be dead forever. */
export async function restoreVerificationToken(token: string, reportId: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.set(`verify:token:${token}`, reportId, { ex: TOKEN_TTL_SECONDS })
}
