import type { Report } from './redis'
import { DISEASE_MAP } from './diseases'

const DAY = 24 * 60 * 60 * 1000

/**
 * How long a pin is kept in Redis before the cleanup cron deletes it for good.
 *
 * Retention is DERIVED from the same `pinTtlDays` the map renders with
 * (`DISEASE_MAP` in lib/diseases.ts) rather than being a second, hand-maintained
 * table. It used to be its own list — lost 30d / parvo 365d / everything else
 * 90d — which silently disagreed with the display TTLs and permanently deleted
 * pins the map still counted as ACTIVE:
 *
 *   • rabies    — shown 180d, deleted at 90d   (90 days early)
 *   • screwworm — shown 365d, deleted at 90d   (275 days early)
 *
 * That is not "hidden", it is a zrem: the record is gone and can only be
 * re-seeded. A confirmed canine rabies case (Andalusia, AL) was destroyed this
 * way at 119 days old, and all three US dog screwworm cases — the rarest data on
 * the map — were on the same path. Deriving both clocks from one source makes
 * that drift impossible rather than merely fixed today.
 */

/** Grace period a pin stays in Redis after it stops being active, during which
 *  it renders dimmed behind the map's "Historical" toggle. 60d preserves the
 *  longest window the old table happened to give (cyano: active 30d, deleted
 *  90d) and extends the same treatment to every disease — several of which
 *  previously had no historical window at all. */
const HISTORICAL_GRACE_DAYS = 60

export const RETENTION_MS = {
  /** Lost-dog posts keep their own short clock: they carry an uploaded photo
   *  and owner contact details, so they are not retained past 30 days. */
  lost: 30 * DAY,
} as const

/** Display TTL for a disease — the exact value the map dims a pin at. */
function displayTtlDays(disease: string): number {
  return DISEASE_MAP[disease]?.pinTtlDays ?? 90
}

export function retentionMsFor(report: Pick<Report, 'kind' | 'disease'>): number {
  if (report.kind === 'lost') return RETENTION_MS.lost
  // Display TTL plus a positive grace period, so retention can never fall below
  // the window the map is still drawing.
  return (displayTtlDays(report.disease) + HISTORICAL_GRACE_DAYS) * DAY
}

/** True if the report is older than its retention window and should be removed. */
export function isExpired(report: Report, now = Date.now()): boolean {
  return now - report.timestamp > retentionMsFor(report)
}
