import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getDashboardData } from '@/lib/dashboard'
import { getDiseaseName } from '@/lib/diseases'
import { buildMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'US Dog Disease Outbreaks by State | ParvoMaps',
  description: 'Where canine disease is being reported across the US right now — outbreak activity by state and by disease, from community reports on ParvoMaps.',
  path: '/outbreaks',
})

// Cache the aggregate read (heavy-ish) for an hour, shared across visitors.
const cachedData = unstable_cache(() => getDashboardData(), ['outbreaks-index'], { revalidate: 3600 })

const wrap = { maxWidth: 820, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const card = { border: '1px solid var(--border)', borderRadius: 8, padding: 18, background: 'var(--bg-card)' } as const

export default async function OutbreaksPage() {
  const data = await cachedData()
  const d = data.disease

  return (
    <main style={wrap}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>US Dog Disease Outbreaks</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
        Where canine disease is being reported across the United States, from community submissions on ParvoMaps.
        Explore the <Link href="/" style={{ color: 'var(--green)' }}>live outbreak map</Link>, browse{' '}
        <Link href="/diseases" style={{ color: 'var(--green)' }}>all tracked diseases</Link>, or check current{' '}
        <Link href="/recalls" style={{ color: 'var(--green)' }}>dog food recalls</Link>.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[['All time', d.total], ['Last 48h', d.last48], ['Last 7 days', d.last7], ['Last 30 days', d.last30]].map(([label, value]) => (
          <div key={label} style={card}>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {d.byDisease.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>By disease</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {d.byDisease.map(b => (
              <Link key={b.key} href={`/diseases/${b.key}`} style={{ fontSize: 13, padding: '8px 14px', borderRadius: 6, textDecoration: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
                {getDiseaseName(b.key)} <span style={{ color: 'var(--text-dim)' }}>· {b.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {d.byState.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>By state</h2>
          <div style={card}>
            {d.byState.map((b, i) => (
              <div key={b.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>{b.label}</span>
                <span style={{ fontWeight: 700 }}>{b.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {d.total === 0 && (
        <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>No active reports right now. Check the <Link href="/" style={{ color: 'var(--green)' }}>map</Link> or <Link href="/diseases" style={{ color: 'var(--green)' }}>browse diseases</Link>.</p>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 24 }}>
        Community-reported data — not veterinary advice. If your dog may be sick, contact your veterinarian.
      </p>
    </main>
  )
}
