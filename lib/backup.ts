import { AwsClient } from 'aws4fetch'
import { getRedisClient } from '@/lib/redis'

/**
 * Off-site backup to Cloudflare R2 (S3-compatible). The whole system is DORMANT
 * until the R2_* env vars are set — isBackupConfigured() gates the cron, so this
 * ships safely and switches on the moment you add the bucket credentials.
 *
 * Env vars (set in Vercel, Production + Preview):
 *   R2_ACCOUNT_ID         — Cloudflare account id
 *   R2_ACCESS_KEY_ID      — R2 API token access key (scope: Object Read & Write)
 *   R2_SECRET_ACCESS_KEY  — R2 API token secret
 *   R2_BUCKET             — bucket name, e.g. parvomaps-backups
 *
 * The R2 token should be LEAST-PRIVILEGE (write, no delete) and the bucket should
 * have Versioning + Object Lock so snapshots can't be tampered with or wiped —
 * that's what makes this resilient to a compromise of the app itself.
 */

/** Normalize an HGETALL result to a plain object. With automaticDeserialization
 *  off (how this app's Redis client is configured), HGETALL returns a FLAT
 *  [field, value, field, value, ...] array instead of an object — storing that
 *  array verbatim and restoring it would corrupt the hash into numeric keys. */
function hashToObject(raw: unknown): Record<string, unknown> {
  if (Array.isArray(raw)) {
    const o: Record<string, unknown> = {}
    for (let i = 0; i < raw.length; i += 2) o[String(raw[i])] = raw[i + 1]
    return o
  }
  return (raw as Record<string, unknown>) ?? {}
}

export function isBackupConfigured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  )
}

/** One stored Redis key, captured with its type + TTL so it round-trips exactly. */
export interface BackupEntry {
  key: string
  type: 'string' | 'set' | 'zset' | 'hash' | 'list'
  ttl: number // seconds remaining, or -1 for no expiry
  value: unknown
}

export interface RedisSnapshot {
  version: 1
  exportedAt: string
  keyCount: number
  entries: BackupEntry[]
}

/**
 * Full, type-aware dump of every key in Redis via SCAN. Small-dataset friendly:
 * a few hundred commands per run, negligible against the Upstash Free allowance.
 */
export async function exportRedis(): Promise<RedisSnapshot> {
  const client = getRedisClient()
  if (!client) throw new Error('Redis not configured')

  const entries: BackupEntry[] = []
  let cursor = '0'
  do {
    const [next, keys] = await client.scan(cursor, { count: 200 })
    cursor = next
    for (const key of keys as string[]) {
      const type = (await client.type(key)) as string
      const ttl = await client.ttl(key)
      let value: unknown
      switch (type) {
        case 'string': value = await client.get(key); break
        case 'set':    value = await client.smembers(key); break
        case 'list':   value = await client.lrange(key, 0, -1); break
        case 'hash':   value = hashToObject(await client.hgetall(key)); break
        case 'zset':   value = await client.zrange(key, 0, -1, { withScores: true }); break
        default:       continue // unknown/unsupported type — skip
      }
      entries.push({ key, type: type as BackupEntry['type'], ttl, value })
    }
  } while (cursor !== '0')

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    keyCount: entries.length,
    entries,
  }
}

function r2Client(): AwsClient {
  return new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    service: 's3',
    region: 'auto',
  })
}

function r2Url(objectKey: string): string {
  const acct = process.env.R2_ACCOUNT_ID!
  const bucket = process.env.R2_BUCKET!
  return `https://${acct}.r2.cloudflarestorage.com/${bucket}/${objectKey}`
}

/** Upload bytes to R2 at objectKey. Throws on a non-2xx response. */
export async function r2Put(objectKey: string, body: Uint8Array | string, contentType: string): Promise<void> {
  const aws = r2Client()
  const res = await aws.fetch(r2Url(objectKey), {
    method: 'PUT',
    body: body as BodyInit,
    headers: { 'Content-Type': contentType },
  })
  if (!res.ok) {
    throw new Error(`R2 PUT ${objectKey} failed: ${res.status} ${await res.text().catch(() => '')}`)
  }
}

/** Fetch the repo tarball from GitHub for the code backup. Uses the API endpoint
 *  with a token (GITHUB_BACKUP_TOKEN, fine-grained PAT w/ Contents:read) so it
 *  works now that the repo is private. Without the token this 404s — the caller
 *  treats that as a non-fatal repoError (the Redis snapshot still succeeds). */
export async function fetchRepoTarball(): Promise<Uint8Array> {
  const url = 'https://api.github.com/repos/ParvoMaps-Us/parvomap/tarball/main'
  const headers: Record<string, string> = {
    'User-Agent': 'parvomaps-backup',
    'Accept': 'application/vnd.github+json',
  }
  const token = process.env.GITHUB_BACKUP_TOKEN
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers }) // follows the redirect to codeload
  if (!res.ok) throw new Error(`GitHub tarball fetch failed: ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}
