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

export function calculateConfidence({
  source,
  hasEmail,
  hasNotes,
}: {
  source?: Source
  hasEmail?: boolean
  hasNotes?: boolean
}): number {
  let score = 50 // base score

  if (source) score += SOURCE_SCORES[source] ?? 0
  if (hasEmail) score += 10
  if (hasNotes) score += 5

  return Math.max(0, Math.min(100, score))
}
