// Live pet-food recall data, sourced from the FDA's official Recalls/Safety
// Alerts RSS feed (human + animal combined) and filtered to pet/animal items.
//
// Why this source: openFDA's food/enforcement endpoint barely covers pet food
// (pet recalls live in FDA's Center for Veterinary Medicine, not that dataset),
// so this RSS is the authoritative, auto-updating option. It carries the most
// recent recalls; pet items are infrequent, so the live list is usually short.
// The /recalls page pairs it with evergreen guidance + a link to FDA's full
// pet-food recall page.

const FDA_RECALLS_RSS =
  'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml'

// FDA's authoritative, complete pet-food recall listing — linked as the canonical
// source so we're a convenience mirror, not the system of record.
export const FDA_PET_RECALLS_URL =
  'https://www.fda.gov/animal-veterinary/safety-health/recalls-withdrawals'

export interface Recall {
  title: string
  url: string
  summary: string
  date: string // human-readable, e.g. "June 5, 2026"
}

// Word-boundary pet signals in the recall title. "animal food/feed" included;
// bare "pet" avoided on its own (it appears in plastics as "PET") — we require
// pet-as-animal context via the other terms or "pet food/treat".
const PET_RE =
  /\b(dog|cat|canine|feline|puppy|kitten)\b|\bpet (food|treat)|\banimal (food|feed)\b/i

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

/** Fetch and parse current pet-food recalls from the FDA feed. Cached 6h.
 *  Fails soft: returns [] on any network/parse error so the page still renders. */
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
      if (!PET_RE.test(title)) continue
      const description = tag(block, 'description')
      // FDA descriptions lead with the date, e.g. "June 5, 2026 — ...".
      const dateMatch = description.match(
        /([A-Z][a-z]+ \d{1,2},? \d{4})/,
      )
      recalls.push({
        title,
        url: tag(block, 'link'),
        summary: description.replace(/^[A-Z][a-z]+ \d{1,2},?\s*\d{4}\s*[—–-]?\s*/, '').slice(0, 240),
        date: dateMatch ? dateMatch[1] : '',
      })
    }
    return recalls
  } catch (e) {
    console.error('Pet food recalls fetch failed:', e)
    return []
  }
}
