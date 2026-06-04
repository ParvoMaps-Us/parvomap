import type { REPORTER_TYPES } from './report-schema'

type ReporterType = typeof REPORTER_TYPES[number]

export type LeadType = 'residential' | 'commercial'

/**
 * Whether a report is a Scoopie BioRest lead, and of what kind.
 *
 * - facility                        → commercial lead (Scoopie notified; handled manually)
 * - individual, own dog affected    → residential lead (Scoopie notified + reporter outreach)
 * - vet, or individual reporting a
 *   sighting (not their own dog)    → not a lead (map data only)
 *
 * Conservative: an individual only qualifies when they explicitly marked their
 * own dog as affected (sighting === false), never on a missing answer.
 */
export function getLeadType(r: {
  reporterType?: ReporterType
  sighting?: boolean
}): LeadType | null {
  if (r.reporterType === 'facility') return 'commercial'
  if (r.reporterType === 'individual' && r.sighting === false) return 'residential'
  return null
}

/** Residential leads get the automated "is your yard safe" reporter outreach. */
export function getsReporterOutreach(r: { reporterType?: ReporterType; sighting?: boolean }): boolean {
  return getLeadType(r) === 'residential'
}
