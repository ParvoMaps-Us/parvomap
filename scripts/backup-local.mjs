// Local one-shot backup — mirrors /api/cron/backup. Reads Upstash + R2 creds
// from .env.local, writes a dated Redis snapshot + repo tarball to R2.
// Use to test the R2 setup without waiting for the nightly Vercel cron.

import { readFileSync } from 'node:fs'
import { Redis } from '@upstash/redis'
import { AwsClient } from 'aws4fetch'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)

const need = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']
for (const k of need) if (!env[k]) { console.error('Missing', k); process.exit(1) }

const r = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN, automaticDeserialization: false })
const aws = new AwsClient({ accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY, service: 's3', region: 'auto' })
const base = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}`
const date = new Date().toISOString().slice(0, 10)

async function put(key, body, type) {
  const res = await aws.fetch(`${base}/${key}`, { method: 'PUT', body, headers: { 'Content-Type': type } })
  if (!res.ok) throw new Error(`R2 PUT ${key} -> ${res.status} ${await res.text().catch(() => '')}`)
  console.log(`  ✓ uploaded ${key}`)
}

// 1) Redis snapshot
const entries = []
let cursor = '0'
do {
  const [next, keys] = await r.scan(cursor, { count: 200 }); cursor = next
  for (const key of keys) {
    const t = await r.type(key); const ttl = await r.ttl(key); let value
    switch (t) {
      case 'string': value = await r.get(key); break
      case 'set': value = await r.smembers(key); break
      case 'list': value = await r.lrange(key, 0, -1); break
      case 'hash': { const h = await r.hgetall(key); value = Array.isArray(h) ? Object.fromEntries(h.reduce((a,_,i)=>(i%2?a:[...a,[String(h[i]),h[i+1]]]),[])) : h; break }
      case 'zset': value = await r.zrange(key, 0, -1, { withScores: true }); break
      default: continue
    }
    entries.push({ key, type: t, ttl, value })
  }
} while (cursor !== '0')
const snapshot = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), keyCount: entries.length, entries })
console.log(`Redis: ${entries.length} keys`)
await put(`redis/redis-${date}.json`, snapshot, 'application/json')

// 2) Repo tarball (public GitHub)
const tar = new Uint8Array(await (await fetch('https://codeload.github.com/ParvoMaps-Us/parvomap/tar.gz/refs/heads/main')).arrayBuffer())
console.log(`Repo tarball: ${(tar.byteLength / 1024).toFixed(0)} KB`)
await put(`repo/repo-${date}.tar.gz`, tar, 'application/gzip')

console.log('\n✅ Backup complete — check the bucket for redis/ and repo/ objects.')
