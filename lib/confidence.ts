import type { SOURCE_VALUES } from './report-schema'

type Source = typeof SOURCE_VALUES[number]

const SOURCE_SCORES: Record<Source, number> = {
  'vet-diagnosed':   20,
  'positive-test':   15,
  'owner-observed':   5,
  'neighbor-report':  0,
  'social-media':    -5,
  'other':            0,
}

const REPORTER_SCORES: Record<'individual' | 'vet' | 'facility' | 'news', number> = {
  vet:        20, // clinical report — highest trust
  news:       15, // published article — sourced
  facility:   10, // boarding/commercial staff
  individual:  0,
}

export function calculateConfidence({
  source,
  reporterType,
  sighting,
  hasEmail,
  hasNotes,
}: {
  source?: Source
  reporterType?: 'individual' | 'vet' | 'facility' | 'news'
  sighting?: boolean
  hasEmail?: boolean
  hasNotes?: boolean
}): number {
  let score = 50 // base score

  if (source) score += SOURCE_SCORES[source] ?? 0
  if (reporterType) score += REPORTER_SCORES[reporterType] ?? 0
  if (sighting) score -= 10 // a secondhand sighting is weaker evidence
  if (hasEmail) score += 10
  if (hasNotes) score += 5

  return Math.max(0, Math.min(100, score))
}
