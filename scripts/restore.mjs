// Restore a Redis snapshot produced by /api/cron/backup.
//
// Usage:
//   1. Download a snapshot from R2 (dashboard / rclone / aws-cli), e.g.
//      redis-2026-06-11.json
//   2. Point the script at the TARGET database. By default it reads the Upstash
//      creds from .env.local — make sure those point at the DB you want to
//      RESTORE INTO (a fresh/clean one), not necessarily prod.
//   3. Dry run first:   node scripts/restore.mjs redis-2026-06-11.json
//      Then for real:    node scripts/restore.mjs redis-2026-06-11.json --yes
//
// The dry run prints what WOULD be written and the target host. Nothing is
// written without --yes.

import { readFileSync } from 'node:fs'
import { Redis } from '@upstash/redis'

const [snapshotPath, ...flags] = process.argv.slice(2)
const confirmed = flags.includes('--yes')
if (!snapshotPath) {
  console.error('Usage: node scripts/restore.mjs <snapshot.json> [--yes]')
  process.exit(1)
}

// Load Upstash creds from .env.local (override by exporting env vars first).
function envFromLocal() {
  try {
    return Object.fromEntries(
      readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
        .split('\n')
        .filter(l => l.includes('=') && !l.trim().startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
    )
  } catch { return {} }
}
const env = { ...envFromLocal(), ...process.env }
const url = env.UPSTASH_REDIS_REST_URL
const token = env.UPSTASH_REDIS_REST_TOKEN
if (!url || !token) { console.error('Missing Upstash creds (UPSTASH_REDIS_REST_URL/TOKEN)'); process.exit(1) }

const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'))
if (snapshot.version !== 1 || !Array.isArray(snapshot.entries)) {
  console.error('Unrecognized snapshot format'); process.exit(1)
}

console.log(`Snapshot:  ${snapshotPath}`)
console.log(`Exported:  ${snapshot.exportedAt}`)
console.log(`Keys:      ${snapshot.keyCount}`)
console.log(`Target DB: ${url}`)
console.log(confirmed ? '\nMODE: WRITING (--yes)\n' : '\nMODE: DRY RUN (pass --yes to write)\n')

const redis = new Redis({ url, token, automaticDeserialization: false })
let written = 0, skipped = 0

for (const { key, type, ttl, value } of snapshot.entries) {
  if (!confirmed) {
    console.log(`  would restore [${type}] ${key}${ttl > 0 ? ` (ttl ${ttl}s)` : ''}`)
    continue
  }
  try {
    switch (type) {
      case 'string':
        await redis.set(key, value, ttl > 0 ? { ex: ttl } : undefined)
        break
      case 'set':
        if (Array.isArray(value) && value.length) await redis.sadd(key, ...value)
        break
      case 'list':
        if (Array.isArray(value) && value.length) await redis.rpush(key, ...value)
        break
      case 'hash': {
        // Older snapshots may hold a flat [field,value,...] array (deser-off
        // HGETALL quirk) — pair it back into an object so we don't write numeric keys.
        const obj = Array.isArray(value)
          ? Object.fromEntries(value.reduce((acc, _, i) => (i % 2 ? acc : [...acc, [String(value[i]), value[i + 1]]]), []))
          : value
        if (obj && Object.keys(obj).length) await redis.hset(key, obj)
        break
      }
      case 'zset': {
        // withScores → flat [member, score, member, score, ...]
        const members = []
        for (let i = 0; i < value.length; i += 2) {
          members.push({ member: value[i], score: Number(value[i + 1]) })
        }
        if (members.length) await redis.zadd(key, ...members)
        break
      }
      default:
        skipped++; continue
    }
    if (ttl > 0 && type !== 'string') await redis.expire(key, ttl)
    written++
  } catch (e) {
    console.error(`  FAILED ${key}:`, e.message)
  }
}

console.log(confirmed
  ? `\nDone. Restored ${written} keys, skipped ${skipped}.`
  : `\nDry run complete — ${snapshot.keyCount} keys would be restored. Re-run with --yes to write.`)
