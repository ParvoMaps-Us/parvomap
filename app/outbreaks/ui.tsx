import Link from 'next/link'
import { DISEASE_MAP } from '@/lib/diseases'
import type { Bucket } from '@/lib/dashboard'
import type { Report } from '@/lib/redis'

// Shared building blocks for the /outbreaks location pages (state, county,
// disease-in-state). Server components only — no client JS.

export const wrap = { maxWidth: 820, margin: '48px auto', padding: '32px 16px 24px', fontFamily: 'var(--mono)', color: 'var(--text)' } as const
export const card = { border: '1px solid var(--border)', borderRadius: 8, padding: 18, background: 'var(--bg-card)' } as const

export function fmt(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Render-time protocol guard, mirroring the check LeafletMap applies before it
 *  links a source. The submit API already enforces http(s), but seeded records
 *  are written straight to Redis and skip that validation, so anything that
 *  reaches an href gets checked here too rather than trusting the store. */
export function safeHttpUrl(url?: string): string | undefined {
  return url && /^https?:\/\//i.test(url) ? url : undefined
}

/** A pin is still "active" while inside its disease's TTL — the same rule the
 *  map dims by, so these pages and the map never disagree. */
export function isActive(r: Report): boolean {
  const ttl = DISEASE_MAP[r.disease]?.pinTtlDays ?? 90
  return Date.now() - r.timestamp < ttl * 24 * 60 * 60 * 1000
}

export function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ ...card, minWidth: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export function BarList({ buckets, hrefFor }: { buckets: Bucket[]; hrefFor?: (b: Bucket) => string | undefined }) {
  const max = buckets[0]?.count ?? 1
  if (buckets.length === 0) return <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Nothing reported yet.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {buckets.slice(0, 10).map(b => {
        const href = hrefFor?.(b)
        return (
          <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 'clamp(96px, 28vw, 170px)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {href ? <Link href={href} style={{ color: 'var(--green)', textDecoration: 'none' }}>{b.label}</Link> : b.label}
            </div>
            <div style={{ flex: 1, height: 8, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(4, (b.count / max) * 100)}%`, height: '100%', background: 'var(--amber)' }} />
            </div>
            <div style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{b.count}</div>
          </div>
        )
      })}
    </div>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{title}</h2>
      {children}
    </div>
  )
}

/** One report card, shared by every location page. */
export function ReportCard({ r, countyText }: { r: Report; countyText?: string }) {
  const src = safeHttpUrl(r.sourceUrl)
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          {DISEASE_MAP[r.disease]?.name ?? r.disease}
          {r.subject === 'wildlife' && <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 400 }}> · in wildlife</span>}
          {r.subject === 'other' && <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 400 }}> · in another animal</span>}
        </div>
        <div style={{ fontSize: 12, color: isActive(r) ? 'var(--green)' : 'var(--text-dim)' }}>
          {isActive(r) ? 'Active' : 'Historical'} · {fmt(r.timestamp)}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
        {[r.city, countyText].filter(Boolean).join(', ')}
      </div>
      {r.locationDetail && (
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{r.locationDetail}</div>
      )}
      {src && (
        <a href={src} target="_blank" rel="noopener noreferrer nofollow"
           style={{ fontSize: 12, color: 'var(--green)', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>
          Source ↗
        </a>
      )}
    </div>
  )
}

/** Serialize for an inline <script type="application/ld+json"> block.
 *  JSON.stringify does NOT escape "</script>", so a string field sourced from
 *  Redis (county names, location details) could otherwise close the tag and
 *  inject markup. Escaping "<" neutralizes that while staying valid JSON. */
export function jsonLdSafe(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
