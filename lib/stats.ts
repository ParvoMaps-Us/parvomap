import { getRedisClient, type Report } from '@/lib/redis'

/**
 * Permanent case tallies — the only ParvoMaps data that is never deleted.
 *
 * WHY THIS EXISTS
 * Every verified pin lives in the `reports:verified` sorted set and is hard
 * deleted by the cleanup cron once it passes its retention window (see
 * lib/retention.ts). Dashboard totals are counted live from that set, so they
 * shrink as pins expire: a cyano case counted today is gone from every number
 * 90 days later, with no record it ever happened.
 *
 * These counters fix that. They are incremented once, at verification time, and
 * never decremented or expired. They hold counts only — no coordinates, no zip,
 * no notes, nothing that could identify a reporter or a household — so keeping
 * them forever creates no privacy exposure even though the underlying report is
 * deleted on schedule. That separation is deliberate: the case is remembered,
 * the person is not.
 *
 * DOG VS WILDLIFE
 * Every count is split by `subject`, because the combined number is misleading
 * for exactly the diseases people search hardest. "Rabies cases in 2026" means
 * something very different if most of them were skunks and bats rather than
 * dogs, and the same applies to distemper and leptospirosis. Publishing a merged
 * figure would overstate the risk to dogs, so the split is stored at write time
 * rather than reconstructed later. Reports predating the `subject` field, and
 * any report that omits it, are counted as 'dog' — the map's default subject.
 *
 * KEYS
 *   stats:alltime              hash
 *   stats:yearly:<YYYY>        hash, one per calendar year, same field shape
 *   stats:yearly:<YYYY>:states hash, state code -> count (disease reports only)
 *   stats:meta                 hash, firstReportAt / lastWriteAt / backfilledAt /
 *                              backfillThrough
 *
 * Tally hash fields:
 *   <disease>            all subjects for that disease
 *   <disease>:wildlife   wildlife only     <disease>:other   other animals only
 *   <disease>:dog        dogs only
 *   _total _dog _wildlife _other   grand totals across diseases
 *   _lost                lost-dog posts, never part of any case count
 *
 * Years are bucketed in UTC so the boundary is deterministic regardless of where
 * the function runs. On Dec 31 a late-evening US report lands in the following
 * year; across a full year that is a rounding error, and a stable rule beats a
 * server-timezone-dependent one.
 */

const TOTAL_FIELD = '_total'
/** Lost-dog posts are counted separately: they are not disease cases and must
 *  never inflate a "cases per year" figure. */
const LOST_FIELD = '_lost'

export const SUBJECTS = ['dog', 'wildlife', 'other'] as const
export type Subject = (typeof SUBJECTS)[number]

export const ALLTIME_KEY = 'stats:alltime'
export const META_KEY = 'stats:meta'

export function yearKey(year: number): string {
  return `stats:yearly:${year}`
}

export function yearStatesKey(year: number): string {
  return `stats:yearly:${year}:states`
}

export function yearOf(timestamp: number): number {
  return new Date(timestamp).getUTCFullYear()
}

/** Normalize a report's subject. Undefined means the report predates the field
 *  or the reporter left it blank; on a dog disease map that is a dog. */
export function subjectOf(report: Pick<Report, 'subject'>): Subject {
  const s = report.subject
  return s === 'wildlife' || s === 'other' ? s : 'dog'
}

/** Counts for one disease (or one grand total), broken out by who was infected. */
export interface SubjectSplit {
  total: number
  dog: number
  wildlife: number
  other: number
}

export interface YearStats {
  year: number
  /** Grand totals across all diseases, split by subject. */
  cases: SubjectSplit
  /** Lost-dog posts. Not a disease case, tracked only so the number exists. */
  lost: number
  byDisease: Record<string, SubjectSplit>
  byState: Record<string, number>
}

export interface AllTimeStats {
  cases: SubjectSplit
  lost: number
  byDisease: Record<string, SubjectSplit>
  /** Timestamp of the earliest report ever counted, or null if none. */
  firstReportAt: number | null
  /** Last date covered by an R2 backfill, or null if never backfilled. Anything
   *  reported before this date but missing from the snapshots is unrecoverable,
   *  so surfacing it keeps the numbers honest on the public page. */
  backfillThrough: string | null
}

const emptySplit = (): SubjectSplit => ({ total: 0, dog: 0, wildlife: 0, other: 0 })

/**
 * Record one verified report into the permanent tallies.
 *
 * Best-effort by design: a stats write must never fail a verification. If Redis
 * is unavailable the report is still published and the count is simply missed,
 * which the R2 backfill can repair later. Never let this throw into the caller.
 */
export async function recordReportStats(report: Report): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    // Idempotence guard, and the reason it is required here specifically.
    //
    // The zadd in publishVerifiedReport self-heals a duplicate: re-publishing
    // the same report writes a byte-identical member string, so the sorted set
    // stays one member and the old count-live-off-the-set approach was immune.
    // HINCRBY has no such property, so without this claim a replayed
    // verification would inflate the permanent record forever. The window is
    // real: app/api/verify/route.ts reads the token with a plain get and does
    // not delete it until several round trips later, so a mail-client
    // safe-link prefetch racing a genuine click reaches this function twice.
    //
    // Deliberately no TTL. The marker must outlive the report itself, which is
    // hard deleted at retention, or a late replay could double-count a case
    // whose pin no longer exists. One small key per report is the same
    // permanence tradeoff the tallies already make.
    const claimed = await client.set(`stats:counted:${report.id}`, '1', { nx: true })
    if (!claimed) return

    const year = yearOf(report.timestamp)
    const yKey = yearKey(year)
    const p = client.pipeline()

    if (report.kind === 'lost') {
      // Lost dogs carry no disease and never touch a case total.
      p.hincrby(ALLTIME_KEY, LOST_FIELD, 1)
      p.hincrby(yKey, LOST_FIELD, 1)
      p.hset(META_KEY, { lastWriteAt: String(Date.now()) })
      await p.exec()
      return
    }

    if (!report.disease) return
    const subject = subjectOf(report)

    // Only per-subject fields are stored. Totals are summed on read instead of
    // being kept as their own counters, so a disease total can never disagree
    // with its own dog/wildlife/other split. A denormalized total is one more
    // number that can drift, and drift in the only surviving record is worse
    // than the trivial cost of adding three values at read time.
    for (const key of [ALLTIME_KEY, yKey]) {
      p.hincrby(key, `${report.disease}:${subject}`, 1)
      p.hincrby(key, `_${subject}`, 1)
    }
    if (report.state) p.hincrby(yearStatesKey(year), report.state, 1)

    p.hset(META_KEY, { lastWriteAt: String(Date.now()) })
    await p.exec()

    // Earliest-report marker, written only when it moves earlier. Kept out of
    // the pipeline so a read can gate it; a wrong value misdates the archive.
    const existing = await client.hget<string>(META_KEY, 'firstReportAt')
    if (!existing || report.timestamp < Number(existing)) {
      await client.hset(META_KEY, { firstReportAt: String(report.timestamp) })
    }
  } catch (e) {
    console.error('recordReportStats failed (report still published):', e)
  }
}

/**
 * Normalize an HGETALL result to a plain object.
 *
 * This client runs with automaticDeserialization off (see getRedisClient), and
 * in that mode HGETALL comes back as a FLAT [field, value, field, value, ...]
 * array rather than an object. Indexing that array by field name silently
 * yields undefined, so every count would read as zero with no error anywhere.
 * lib/backup.ts hit the same trap; this is the same fix.
 */
function hashToObject(raw: unknown): Record<string, unknown> {
  if (Array.isArray(raw)) {
    const o: Record<string, unknown> = {}
    for (let i = 0; i < raw.length; i += 2) o[String(raw[i])] = raw[i + 1]
    return o
  }
  return (raw as Record<string, unknown>) ?? {}
}

/** Upstash returns hash values as strings; coerce and reject junk. */
function num(raw: Record<string, unknown> | null, field: string): number {
  const n = Number(raw?.[field])
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Build a split from the three per-subject fields, summing rather than reading
 *  a stored total, so the parts always add up to the whole by construction. A
 *  legacy `<prefix>` field written before totals were derived is used only as a
 *  floor, never as the answer. */
function splitFrom(raw: Record<string, unknown> | null, prefix: string): SubjectSplit {
  const dog = num(raw, `${prefix}:dog`)
  const wildlife = num(raw, `${prefix}:wildlife`)
  const other = num(raw, `${prefix}:other`)
  return { total: Math.max(dog + wildlife + other, num(raw, prefix)), dog, wildlife, other }
}

/** Grand totals use underscore-prefixed fields (`_dog`) so they can never
 *  collide with a disease name. Summed on read for the same reason as above. */
function grandTotals(raw: Record<string, unknown> | null): SubjectSplit {
  const dog = num(raw, '_dog')
  const wildlife = num(raw, '_wildlife')
  const other = num(raw, '_other')
  return { total: Math.max(dog + wildlife + other, num(raw, TOTAL_FIELD)), dog, wildlife, other }
}

/** Pull the distinct disease names out of a tally hash, ignoring the `:subject`
 *  suffixed fields and the reserved underscore fields. */
function diseasesIn(raw: Record<string, unknown> | null): string[] {
  if (!raw) return []
  const names = new Set<string>()
  for (const field of Object.keys(raw)) {
    if (field.startsWith('_')) continue
    names.add(field.split(':')[0])
  }
  return [...names]
}

function byDiseaseFrom(raw: Record<string, unknown> | null): Record<string, SubjectSplit> {
  const out: Record<string, SubjectSplit> = {}
  for (const name of diseasesIn(raw)) {
    const split = splitFrom(raw, name)
    if (split.total > 0) out[name] = split
  }
  return out
}

function countsFrom(raw: Record<string, unknown> | null): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw) return out
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('_')) continue
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) out[k] = n
  }
  return out
}

export async function getAllTimeStats(): Promise<AllTimeStats> {
  const empty: AllTimeStats = {
    cases: emptySplit(), lost: 0, byDisease: {}, firstReportAt: null, backfillThrough: null,
  }
  const client = getRedisClient()
  if (!client) return empty

  try {
    const [rawRes, metaRes] = await Promise.all([
      client.hgetall(ALLTIME_KEY),
      client.hgetall(META_KEY),
    ])
    const raw = hashToObject(rawRes)
    const meta = hashToObject(metaRes)
    const first = Number(meta.firstReportAt)
    return {
      cases: grandTotals(raw),
      lost: num(raw, LOST_FIELD),
      byDisease: byDiseaseFrom(raw),
      firstReportAt: Number.isFinite(first) && first > 0 ? first : null,
      backfillThrough: typeof meta.backfillThrough === 'string' ? meta.backfillThrough : null,
    }
  } catch (e) {
    console.error('getAllTimeStats failed:', e)
    return empty
  }
}

export async function getYearStats(year: number): Promise<YearStats> {
  const empty: YearStats = { year, cases: emptySplit(), lost: 0, byDisease: {}, byState: {} }
  const client = getRedisClient()
  if (!client) return empty

  try {
    const [rawRes, statesRes] = await Promise.all([
      client.hgetall(yearKey(year)),
      client.hgetall(yearStatesKey(year)),
    ])
    const raw = hashToObject(rawRes)
    const states = hashToObject(statesRes)
    return {
      year,
      cases: grandTotals(raw),
      lost: num(raw, LOST_FIELD),
      byDisease: byDiseaseFrom(raw),
      byState: countsFrom(states),
    }
  } catch (e) {
    console.error(`getYearStats(${year}) failed:`, e)
    return empty
  }
}

/**
 * Years that actually have data, newest first.
 *
 * Derived from the first-report marker rather than a SCAN: the range is a
 * handful of years and SCAN against Upstash costs a round trip per cursor.
 * Returns an empty array before the first report is ever counted, which is the
 * signal the public stats pages use to stay unpublished.
 */
export async function getAvailableYears(): Promise<number[]> {
  const { firstReportAt } = await getAllTimeStats()
  if (!firstReportAt) return []
  const first = yearOf(firstReportAt)
  const current = new Date().getUTCFullYear()
  const years: number[] = []
  for (let y = current; y >= first; y--) years.push(y)
  return years
}

/** Every year's stats in one pass, newest first. Used by the stats index and
 *  the year-over-year comparison an end-of-year article is built from. */
export async function getAllYearStats(): Promise<YearStats[]> {
  const years = await getAvailableYears()
  return Promise.all(years.map(getYearStats))
}
