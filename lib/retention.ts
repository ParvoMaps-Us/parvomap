import type { Report } from './redis'

const DAY = 24 * 60 * 60 * 1000

// How long a pin stays on the map before the cleanup cron deletes it.
//   • Lost-dog reports: 30 days (and their uploaded photo is deleted too).
//   • Parvo: 12 months — canine parvovirus survives in soil for up to a year.
//   • Every other disease/hazard: 90 days.
export const RETENTION_MS = {
  lost:   30  * DAY,
  parvo:  365 * DAY,
  others: 90  * DAY,
} as const

export function retentionMsFor(report: Pick<Report, 'kind' | 'disease'>): number {
  if (report.kind === 'lost') return RETENTION_MS.lost
  if (report.disease === 'parvo') return RETENTION_MS.parvo
  return RETENTION_MS.others
}

/** True if the report is older than its retention window and should be removed. */
export function isExpired(report: Report, now = Date.now()): boolean {
  return now - report.timestamp > retentionMsFor(report)
}
