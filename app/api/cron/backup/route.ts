import { exportRedis, r2Put, fetchRepoTarball, isBackupConfigured } from '@/lib/backup'

/**
 * Daily off-site backup → Cloudflare R2. Writes two dated, immutable objects:
 *   redis/redis-YYYY-MM-DD.json   — full type-aware Redis snapshot
 *   repo/repo-YYYY-MM-DD.tar.gz   — source code (public GitHub tarball)
 *
 * DORMANT until the R2_* env vars are set (returns 200 "skipped"), so it ships
 * safely. Retention/immutability is enforced at the bucket (Versioning + Object
 * Lock + a lifecycle rule) — this job only ever writes, never deletes.
 *
 * vercel.json: { "path": "/api/cron/backup", "schedule": "0 3 * * *" }
 */
export async function GET(req: Request) {
  // Same Bearer guard as the other cron routes.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!isBackupConfigured()) {
    return Response.json({ ok: true, skipped: 'R2 not configured' })
  }

  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const result: Record<string, unknown> = { date }

  // 1. Redis snapshot (the irreplaceable data).
  try {
    const snapshot = await exportRedis()
    await r2Put(
      `redis/redis-${date}.json`,
      JSON.stringify(snapshot),
      'application/json',
    )
    result.redis = { keyCount: snapshot.keyCount }
  } catch (e) {
    console.error('Redis backup failed:', e)
    result.redisError = (e as Error).message
  }

  // 2. Source code tarball (off-GitHub copy in case the repo is compromised).
  try {
    const tarball = await fetchRepoTarball()
    await r2Put(`repo/repo-${date}.tar.gz`, tarball, 'application/gzip')
    result.repo = { bytes: tarball.byteLength }
  } catch (e) {
    console.error('Repo backup failed:', e)
    result.repoError = (e as Error).message
  }

  const ok = !result.redisError && !result.repoError
  console.log('Backup run:', result)
  return Response.json({ ok, ...result }, { status: ok ? 200 : 500 })
}
