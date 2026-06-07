import type { Metadata } from 'next'
import { getDashboardData, type Bucket, type DashboardData } from '@/lib/dashboard'
import { getDiseaseName } from '@/lib/diseases'
import type { Report } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Tracking Dashboard — ParvoMaps',
  robots: { index: false, follow: false },
}

const card = {
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: 16,
  background: 'var(--bg-card)',
} as const

function fmt(ts: number): string {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ ...card, minWidth: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function BarList({ title, buckets, accent }: { title: string; buckets: Bucket[]; accent: string }) {
  const max = buckets[0]?.count ?? 1
  return (
    <div style={card}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>{title}</div>
      {buckets.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No data yet.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {buckets.slice(0, 12).map(b => (
          <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 130, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</div>
            <div style={{ flex: 1, height: 8, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(4, (b.count / max) * 100)}%`, height: '100%', background: accent }} />
            </div>
            <div style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{b.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentTable({ rows, lost }: { rows: Report[]; lost?: boolean }) {
  if (rows.length === 0) return <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No reports yet.</div>
  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ color: 'var(--text-dim)', textAlign: 'left' }}>
            <th style={{ padding: '4px 8px' }}>{lost ? 'Dog / kind' : 'Disease'}</th>
            <th style={{ padding: '4px 8px' }}>Location</th>
            <th style={{ padding: '4px 8px' }}>When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--border-dim, var(--border))' }}>
              <td style={{ padding: '6px 8px' }}>
                {lost
                  ? `${r.dogName || 'Unnamed'} · ${r.lostKind === 'sighting' ? 'sighting' : 'owner'}`
                  : getDiseaseName(r.disease)}
              </td>
              <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>
                {[r.city, r.state].filter(Boolean).join(', ') || r.zip || '—'}
              </td>
              <td style={{ padding: '6px 8px', color: 'var(--text-dim)' }}>{fmt(r.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const { key } = await searchParams
  const adminKey = process.env.ADMIN_KEY

  if (!adminKey || key !== adminKey) {
    return (
      <main style={{ maxWidth: 520, margin: '80px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
        <h1 style={{ fontSize: 18, marginBottom: 12 }}>🔒 Tracking Dashboard</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6 }}>
          {adminKey
            ? 'Access denied. Append the correct ?key= to the URL.'
            : 'ADMIN_KEY is not configured. Set it in your Vercel environment to enable this dashboard.'}
        </p>
      </main>
    )
  }

  const data: DashboardData = await getDashboardData()
  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 } as const
  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 } as const

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>📊 Tracking Dashboard</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 28 }}>
        Generated {fmt(data.generatedAt)} · internal view
      </p>

      {/* ─── Diseases ─── */}
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>🦠 Disease & hazard reports</h2>
      <div style={{ ...grid3, marginBottom: 14 }}>
        <StatTile label="All time" value={data.disease.total} />
        <StatTile label="Last 48 h" value={data.disease.last48} />
        <StatTile label="Last 7 days" value={data.disease.last7} />
        <StatTile label="Last 30 days" value={data.disease.last30} />
      </div>
      <div style={{ ...grid2, marginBottom: 14 }}>
        <BarList title="By disease" buckets={data.disease.byDisease} accent="var(--d-parvo, var(--green))" />
        <BarList title="By state" buckets={data.disease.byState} accent="var(--amber)" />
        <BarList title="By reporter type" buckets={data.disease.byReporter} accent="var(--green)" />
      </div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>Most recent</div>
        <RecentTable rows={data.disease.recent} />
      </div>

      {/* ─── Lost dogs ─── */}
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>🐶 Lost-dog reports</h2>
      <div style={{ ...grid3, marginBottom: 14 }}>
        <StatTile label="All time" value={data.lost.total} />
        <StatTile label="Last 7 days" value={data.lost.last7} />
        <StatTile label="Owner reports" value={data.lost.owner} />
        <StatTile label="Sightings" value={data.lost.sighting} />
      </div>
      <div style={{ ...grid2, marginBottom: 14 }}>
        <BarList title="By state" buckets={data.lost.byState} accent="#60a5fa" />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>Most recent</div>
        <RecentTable rows={data.lost.recent} lost />
      </div>
    </main>
  )
}
