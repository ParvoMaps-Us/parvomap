// Pet-food recall data, sourced from the FDA's official Recalls/Safety Alerts
// RSS feed (human + animal combined) and filtered to pet/animal items.
//
// Why this source: openFDA's food/enforcement endpoint barely covers pet food
// (pet recalls live in FDA's Center for Veterinary Medicine, not that dataset),
// so this RSS is the authoritative, auto-updating option. It's a rolling window
// of the latest ~20 recalls, so each pet item eventually ages out of the feed.
// We persist them to a Redis archive (see below) so /recalls keeps history and
// each recall gets a durable /recalls/<slug> page.

import { getRedisClient } from './redis'

const FDA_RECALLS_RSS =
  'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml'

// FDA's authoritative, complete pet-food recall listing — linked as the canonical
// source so we're a convenience mirror, not the system of record.
export const FDA_PET_RECALLS_URL =
  'https://www.fda.gov/animal-veterinary/safety-health/recalls-withdrawals'

export interface Recall {
  /** Stable URL slug, derived from the FDA notice path. */
  slug: string
  title: string
  url: string
  summary: string
  date: string // human-readable, e.g. "June 5, 2026"
  /** Epoch ms parsed from the date, for sorting + datePublished (0 if unknown). */
  ts: number
}

/** Does a recall mention one of the subscriber's brands? Returns the matched
 *  brand (as the user typed it) or null. Case-insensitive substring match on the
 *  recall title + summary; brands under 3 chars are ignored to avoid noise. */
export function matchBrand(recall: Recall, brands: string[]): string | null {
  const hay = `${recall.title} ${recall.summary}`.toLowerCase()
  for (const b of brands) {
    const needle = b.trim().toLowerCase()
    if (needle.length >= 3 && hay.includes(needle)) return b.trim()
  }
  return null
}

// Pet signals checked against the recall title AND description. Some pet-food
// recalls name only the brand + product (e.g. "Steve's Real Food Freeze-Dried
// Chicken Recipe, Low Thiamine") with no "dog/cat" word, so we also match
// pet-food formulation cues: thiamine (a classic pet-food deficiency recall),
// freeze-dried, kibble, "raw food". "animal food/feed" and "pet food/treat"
// stay phrase-bound; bare "pet" is avoided (it appears as plastics "PET").
const PET_RE =
  /\b(dog|cat|canine|feline|puppy|kitten|kibble|thiamine)\b|\bpet (food|treat)|\banimal (food|feed)\b|\bfreeze-?dried\b|\braw food\b/i

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#x?\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? decodeEntities(m[1]) : ''
}

/** Stable slug for a recall: the last path segment of the FDA notice URL, or a
 *  kebab-cased fallback from the title. */
function slugFor(url: string, title: string): string {
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean).pop()
    if (seg && seg.length > 3) return seg.slice(0, 120)
  } catch {
    /* fall through */
  }
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'recall'
  )
}

/** Fetch and parse current pet-food recalls from the live FDA feed. Cached 6h.
 *  Fails soft: returns [] on any network/parse error. */
export async function getPetFoodRecalls(): Promise<Recall[]> {
  try {
    const res = await fetch(FDA_RECALLS_RSS, {
      headers: { 'User-Agent': 'ParvoMaps/1.0 (+https://www.parvomaps.us)' },
      next: { revalidate: 21600 }, // 6 hours
    })
    if (!res.ok) return []
    const xml = await res.text()

    const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? []
    const recalls: Recall[] = []
    for (const block of items) {
      const title = tag(block, 'title')
      const description = tag(block, 'description')
      // Check both title and description — some pet recalls carry the pet signal
      // only in the body (or only in the brand/formulation, hence the cues above).
      if (!PET_RE.test(`${title} ${description}`)) continue
      const url = tag(block, 'link')
      // FDA descriptions lead with the date, e.g. "June 5, 2026 - ...".
      const dateMatch = description.match(/([A-Z][a-z]+ \d{1,2},? \d{4})/)
      const date = dateMatch ? dateMatch[1] : ''
      const ts = date ? Date.parse(date) || 0 : 0
      recalls.push({
        slug: slugFor(url, title),
        title,
        url,
        summary: description.replace(/^[A-Z][a-z]+ \d{1,2},?\s*\d{4}\s*[—–-]?\s*/, '').slice(0, 240),
        date,
        ts,
      })
    }
    return recalls
  } catch (e) {
    console.error('Pet food recalls fetch failed:', e)
    return []
  }
}

/** Is there a pet-food recall in the FDA's current alerts? Drives the flashing
 *  Recalls-tab dot. Uses the 6h-cached live feed, so it's cheap to call on the
 *  map page render. */
export async function hasCurrentRecall(): Promise<boolean> {
  return (await getPetFoodRecalls()).length > 0
}

// ─── Persistent archive ───────────────────────────────────────────────────────
// The live feed only holds the latest ~20 recalls. We upsert every pet recall we
// see (keyed by slug) into a Redis hash so the list page keeps history and each
// recall has a durable detail page even after it drops out of the FDA feed.
const RECALL_ARCHIVE_HASH = 'recalls:archive'

/** Upsert recalls into the archive. Called by the recall cron on each run. */
export async function archiveRecalls(recalls: Recall[]): Promise<void> {
  const client = getRedisClient()
  if (!client || recalls.length === 0) return
  const entries: Record<string, string> = {}
  for (const r of recalls) {
    if (r.slug) entries[r.slug] = JSON.stringify(r)
  }
  if (Object.keys(entries).length > 0) await client.hset(RECALL_ARCHIVE_HASH, entries)
}

function parseRecall(raw: unknown): Recall | null {
  try {
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as Recall
  } catch {
    return null
  }
}

export async function getArchivedRecalls(): Promise<Recall[]> {
  const client = getRedisClient()
  if (!client) return []
  const all = await client.hgetall<Record<string, string>>(RECALL_ARCHIVE_HASH)
  if (!all) return []
  return Object.values(all)
    .map(parseRecall)
    .filter((r): r is Recall => !!r)
    .sort((a, b) => b.ts - a.ts)
}

export async function getArchivedRecall(slug: string): Promise<Recall | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.hget<string>(RECALL_ARCHIVE_HASH, slug)
  return raw ? parseRecall(raw) : null
}

/** Recalls for the list page: live feed merged with the archive, deduped by
 *  slug, newest first. Live entries win (freshest copy). */
export async function getRecallsForList(): Promise<Recall[]> {
  const [live, archived] = await Promise.all([getPetFoodRecalls(), getArchivedRecalls()])
  const bySlug = new Map<string, Recall>()
  for (const r of archived) bySlug.set(r.slug, r)
  for (const r of live) bySlug.set(r.slug, r) // live overwrites archived
  return [...bySlug.values()].sort((a, b) => b.ts - a.ts)
}

/** A single recall for its detail page: archive first, then the live feed. */
export async function getRecallBySlug(slug: string): Promise<Recall | null> {
  const archived = await getArchivedRecall(slug)
  if (archived) return archived
  const live = await getPetFoodRecalls()
  return live.find(r => r.slug === slug) ?? null
}
