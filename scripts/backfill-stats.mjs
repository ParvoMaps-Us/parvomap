// Rebuild the permanent stats tallies from every R2 snapshot + live Redis.
//
// WHY: lib/stats.ts only counts reports verified from the day it shipped onward.
// Everything before that was counted live off `reports:verified` and then hard
// deleted by the cleanup cron. The nightly R2 snapshots are the only surviving
// record of those reports, so this walks every snapshot, unions them with what
// is still live, dedupes by report id, and writes the result into the counters.
//
// SAFETY: counts are written monotonically (max of computed vs existing), so the
// script is safe to run any number of times and can never lower a number that
// live increments have already recorded. Pass --reset to overwrite exactly
// instead, which is only correct if you believe the tallies are wrong.
//
// USAGE (from the repo root, needs .env.local with R2_* + Redis creds):
//   node scripts/backfill-stats.mjs           # dry run, prints what it would write
//   node scripts/backfill-stats.mjs --apply   # actually write
//   node scripts/backfill-stats.mjs --apply --reset
//
// Reads are the only R2 operation; this never writes to the bucket.

import { readFileSync } from 'node:fs'
import { Redis } from '@upstash/redis'
import { AwsClient } from 'aws4fetch'

const APPLY = process.argv.includes('--apply')
const RESET = process.argv.includes('--reset')

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]
    }),
)

const need = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']
for (const k of need) if (!env[k]) { console.error('Missing', k, 'in .env.local'); process.exit(1) }

const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL
const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN
if (!url || !token) { console.error('Missing Redis URL/token in .env.local'); process.exit(1) }

// automaticDeserialization off to match lib/redis.ts: values were stored with
// JSON.stringify and must come back as raw strings.
const redis = new Redis({ url, token, automaticDeserialization: false })
const aws = new AwsClient({
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  service: 's3',
  region: 'auto',
})
const base = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}`

// ─── Collect every report we can still see, deduped by id ────────────────────

/** id -> { disease, state, timestamp, kind } */
const reports = new Map()

function ingest(raw) {
  let r
  try { r = typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return }
  if (!r || !r.id || !r.timestamp) return
  // First writer wins. Snapshots are processed oldest-first, so the earliest
  // captured version of a report is kept; later edits never change what disease
  // or year it was, and keeping one canonical row makes the run deterministic.
  if (!reports.has(r.id)) {
    reports.set(r.id, {
      disease: r.disease,
      state: r.state || '',
      timestamp: Number(r.timestamp),
      kind: r.kind,
      // Must match subjectOf() in lib/stats.ts: a missing subject predates the
      // field and counts as a dog, the map's default subject.
      subject: r.subject === 'wildlife' || r.subject === 'other' ? r.subject : 'dog',
    })
  }
}

/** Snapshot zsets are stored as a flat [member, score, member, score, ...]. */
function membersFromZset(value) {
  if (!Array.isArray(value)) return []
  const out = []
  for (let i = 0; i < value.length; i += 2) out.push(value[i])
  return out
}

async function listSnapshots() {
  const keys = []
  let token = ''
  // R2 caps a list at 1000 keys, so page until the response says it is done.
  for (;;) {
    const q = `?list-type=2&prefix=redis/&max-keys=1000${token ? `&continuation-token=${encodeURIComponent(token)}` : ''}`
    const res = await aws.fetch(base + q)
    if (!res.ok) throw new Error(`R2 list failed: ${res.status} ${await res.text().catch(() => '')}`)
    const xml = await res.text()
    keys.push(...[...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map(m => m[1]))
    const truncated = /<IsTruncated>true<\/IsTruncated>/.test(xml)
    const next = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)
    if (!truncated || !next) break
    token = next[1]
  }
  return keys.sort() // date-named, so lexical sort is chronological
}

console.log(APPLY ? 'BACKFILL (writing)' : 'BACKFILL (dry run, pass --apply to write)')

const snapshots = await listSnapshots()
console.log(`\nR2 snapshots found: ${snapshots.length}`)
if (snapshots.length) console.log(`  range: ${snapshots[0]} .. ${snapshots[snapshots.length - 1]}`)

let latestSnapshotDate = null
for (const key of snapshots) {
  const res = await aws.fetch(`${base}/${key}`)
  if (!res.ok) { console.warn(`  ! skip ${key} (${res.status})`); continue }
  const snap = await res.json()
  const entry = (snap.entries || []).find(e => e.key === 'reports:verified')
  const before = reports.size
  for (const m of membersFromZset(entry?.value)) ingest(m)
  const date = key.match(/redis-(\d{4}-\d{2}-\d{2})\.json/)?.[1]
  if (date) latestSnapshotDate = date
  console.log(`  ${key}: +${reports.size - before} new (running total ${reports.size})`)
}

// Live Redis last: catches everything verified since the newest snapshot.
const liveBefore = reports.size
const live = await redis.zrange('reports:verified', 0, -1)
for (const m of live) ingest(m)
console.log(`\nLive Redis: ${live.length} reports, +${reports.size - liveBefore} not present in any snapshot`)
console.log(`Unique reports total: ${reports.size}`)

// ─── Tally ───────────────────────────────────────────────────────────────────

const LOST = '_lost'
const alltime = {}
const yearly = {}   // year -> { field -> count }
const states = {}   // year -> { state -> count }
let firstReportAt = null

const bump = (obj, field) => { obj[field] = (obj[field] || 0) + 1 }

for (const r of reports.values()) {
  const year = new Date(r.timestamp).getUTCFullYear() // UTC to match lib/stats.ts
  if (firstReportAt === null || r.timestamp < firstReportAt) firstReportAt = r.timestamp

  yearly[year] ??= {}
  states[year] ??= {}

  if (r.kind === 'lost') {
    bump(alltime, LOST)
    bump(yearly[year], LOST)
    continue
  }
  if (!r.disease) continue

  // Exactly the field shape lib/stats.ts writes: per-subject fields only. No
  // denormalized disease or grand total is stored, so a total can never
  // disagree with its own split. Totals are summed on read on both sides.
  for (const target of [alltime, yearly[year]]) {
    bump(target, `${r.disease}:${r.subject}`)
    bump(target, `_${r.subject}`)
  }
  if (r.state) bump(states[year], r.state)
}

const years = Object.keys(yearly).map(Number).sort((a, b) => b - a)
const grand = t => (t._dog || 0) + (t._wildlife || 0) + (t._other || 0)
const line = t =>
  `${grand(t)} cases (dog ${t._dog || 0}, wildlife ${t._wildlife || 0}, other ${t._other || 0})`

/** Sum a disease's per-subject fields, mirroring splitFrom() in lib/stats.ts. */
function diseaseTotals(t) {
  const out = {}
  for (const [field, v] of Object.entries(t)) {
    if (field.startsWith('_')) continue
    const name = field.split(':')[0]
    out[name] = (out[name] || 0) + v
  }
  return out
}

console.log('\n─── Computed ───')
console.log(`all time: ${line(alltime)}   lost-dog posts: ${alltime[LOST] || 0}`)
for (const y of years) {
  const top = Object.entries(diseaseTotals(yearly[y]))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => {
      const wild = yearly[y][`${k}:wildlife`] || 0
      return wild ? `${k} ${v} (${wild} wildlife)` : `${k} ${v}`
    })
    .join(', ')
  console.log(`  ${y}: ${line(yearly[y])}`)
  console.log(`        ${top}`)
}
if (firstReportAt) console.log(`earliest report: ${new Date(firstReportAt).toISOString().slice(0, 10)}`)

if (!APPLY) {
  console.log('\nDry run only. Re-run with --apply to write these counts.')
  process.exit(0)
}

// ─── Write ───────────────────────────────────────────────────────────────────

/** HGETALL returns a FLAT [field, value, ...] array when the client runs with
 *  automaticDeserialization off, which is how this script and the app configure
 *  it. Indexing that by field name silently yields undefined. */
function hashToObject(raw) {
  if (Array.isArray(raw)) {
    const o = {}
    for (let i = 0; i < raw.length; i += 2) o[String(raw[i])] = raw[i + 1]
    return o
  }
  return raw ?? {}
}

/**
 * Merge computed counts into an existing hash.
 *
 * Default path raises each field to the computed value using HINCRBY of the
 * DIFFERENCE rather than HSET of the result. That matters: HSET would be a
 * read-modify-write, and a verification landing between the read and the write
 * would have its increment silently overwritten and lost forever. HINCRBY is
 * atomic and additive, so a concurrent +1 survives and simply lands on top.
 *
 * Fields are only ever raised, never lowered, so a re-run can never erase a
 * count recorded live for a report that has since expired out of Redis.
 *
 * --reset deletes the key first, so it is a true exact overwrite. Plain HSET
 * merges into whatever is already there, which would leave stale fields behind
 * and quietly contradict what --reset claims to do.
 */
async function writeHash(key, computed) {
  if (!Object.keys(computed).length) return

  if (RESET) {
    await redis.del(key)
    await redis.hset(key, Object.fromEntries(Object.entries(computed).map(([k, v]) => [k, String(v)])))
    console.log(`  reset ${key} (${Object.keys(computed).length} fields)`)
    return
  }

  const existing = hashToObject(await redis.hgetall(key))
  let raised = 0
  for (const [field, want] of Object.entries(computed)) {
    const prev = Number(existing[field])
    const have = Number.isFinite(prev) && prev > 0 ? prev : 0
    const delta = want - have
    if (delta > 0) {
      await redis.hincrby(key, field, delta)
      raised++
    }
  }
  console.log(`  ${key}: raised ${raised}/${Object.keys(computed).length} fields`)
}

console.log('\n─── Writing ───')
await writeHash('stats:alltime', alltime)
for (const y of years) {
  await writeHash(`stats:yearly:${y}`, yearly[y])
  await writeHash(`stats:yearly:${y}:states`, states[y])
}

const meta = { backfilledAt: String(Date.now()) }
// The public pages read this to state how far back the archive actually reaches.
if (latestSnapshotDate) meta.backfillThrough = latestSnapshotDate

// firstReportAt may only ever move EARLIER.
//
// getAvailableYears() in lib/stats.ts does not scan for stats:yearly:* keys; it
// walks from the current UTC year down to yearOf(firstReportAt). So this single
// field decides which years are visible at all. Writing a later value than what
// is stored would leave the older stats:yearly:<YYYY> hashes intact but
// unreachable, silently unpublishing whole years. That is exactly what happens
// if this script is ever run when the oldest snapshots have aged out of R2.
if (firstReportAt !== null) {
  const prevRaw = await redis.hget('stats:meta', 'firstReportAt')
  const prev = Number(prevRaw)
  const keepExisting = !RESET && Number.isFinite(prev) && prev > 0 && prev < firstReportAt
  if (keepExisting) {
    console.log(
      `  keeping existing firstReportAt ${new Date(prev).toISOString().slice(0, 10)}` +
      ` (earlier than computed ${new Date(firstReportAt).toISOString().slice(0, 10)})`,
    )
  } else {
    meta.firstReportAt = String(firstReportAt)
  }
}

await redis.hset('stats:meta', meta)
console.log('  wrote stats:meta', meta)

console.log('\nDone.')
