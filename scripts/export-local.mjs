// Manual, local, type-aware export of a Redis database to a JSON file.
// Companion to restore.mjs (same snapshot format as /api/cron/backup).
//
// Usage:
//   node scripts/export-local.mjs                  # reads .env.local creds
//   node scripts/export-local.mjs my-snapshot.json # custom output name
//   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/export-local.mjs
//
// Reads only — never writes to the source DB.

import { readFileSync, writeFileSync } from 'node:fs'
import { Redis } from '@upstash/redis'

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
if (!url || !token) { console.error('Missing Upstash creds'); process.exit(1) }

const out = process.argv[2] || `migration-snapshot-${new Date().toISOString().slice(0, 10)}.json`
const r = new Redis({ url, token, automaticDeserialization: false })

const entries = []
let cursor = '0'
do {
  const [next, keys] = await r.scan(cursor, { count: 200 })
  cursor = next
  for (const key of keys) {
    const type = await r.type(key)
    const ttl = await r.ttl(key)
    let value
    switch (type) {
      case 'string': value = await r.get(key); break
      case 'set':    value = await r.smembers(key); break
      case 'list':   value = await r.lrange(key, 0, -1); break
      case 'hash': { const h = await r.hgetall(key); value = Array.isArray(h) ? Object.fromEntries(h.reduce((a,_,i)=>(i%2?a:[...a,[String(h[i]),h[i+1]]]),[])) : h; break }
      case 'zset':   value = await r.zrange(key, 0, -1, { withScores: true }); break
      default: continue
    }
    entries.push({ key, type, ttl, value })
  }
} while (cursor !== '0')

const snapshot = { version: 1, exportedAt: new Date().toISOString(), keyCount: entries.length, entries }
writeFileSync(out, JSON.stringify(snapshot, null, 2))
console.log(`Exported ${entries.length} keys from ${url}`)
console.log(`→ ${out}`)
console.log('Types:', entries.reduce((a, e) => (a[e.type] = (a[e.type] || 0) + 1, a), {}))
