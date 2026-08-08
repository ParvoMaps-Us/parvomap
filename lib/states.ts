// US state lookup for location pages. Slug is the URL segment
// (/outbreaks/utah), abbr is what report records store in `state`.

export interface StateInfo {
  abbr: string
  name: string
  slug: string
}

const NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'Washington, D.C.',
}

export const toSlug = (name: string): string =>
  name.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, '-')

export const STATES: StateInfo[] = Object.entries(NAMES)
  .map(([abbr, name]) => ({ abbr, name, slug: toSlug(name) }))
  .sort((a, b) => a.name.localeCompare(b.name))

const BY_SLUG = new Map(STATES.map(s => [s.slug, s]))
const BY_ABBR = new Map(STATES.map(s => [s.abbr, s]))

export function getStateBySlug(slug: string): StateInfo | undefined {
  return BY_SLUG.get(slug.toLowerCase())
}

export function getStateName(abbr: string): string {
  return BY_ABBR.get(abbr)?.name ?? abbr
}

export function getStateSlug(abbr: string): string | undefined {
  return BY_ABBR.get(abbr)?.slug
}

/** Seeded records are inconsistent about the "County" suffix — some store
 *  "Utah", others "Utah County", and untreated they tally as two separate
 *  counties. Strip the suffix so they merge; add it back only for display. */
export function normalizeCounty(county?: string): string | undefined {
  const c = county?.trim()
  if (!c) return undefined
  return c.replace(/\s+(County|Parish|Borough|Census Area|Planning Region)$/i, '').trim() || undefined
}

/** Display form: "Utah" -> "Utah County". Louisiana/Alaska keep their own
 *  vocabulary, and the independent cities Virginia reports are left alone. */
export function countyLabel(county: string | undefined, stateAbbr?: string): string | undefined {
  const base = normalizeCounty(county)
  if (!base) return undefined
  if (/\b(City|Municipality|Region)$/i.test(base)) return base
  if (stateAbbr === 'LA') return `${base} Parish`
  if (stateAbbr === 'AK') return `${base} Borough`
  return `${base} County`
}
