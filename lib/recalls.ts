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
      const description = tag(block, 'description')
      // Check both title and description — some pet recalls carry the pet signal
      // only in the body (or only in the brand/formulation, hence the cues above).
      if (!PET_RE.test(`${title} ${description}`)) continue
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
