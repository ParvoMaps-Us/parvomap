import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getDiseaseInfo, getRelatedDiseases, CATEGORY_LABELS, SEVERITY_LABELS, type DiseaseSeverity } from '@/lib/diseases'
import { getDiseaseStats, type Bucket } from '@/lib/dashboard'
import { buildMetadata } from '@/lib/seo'

// Pages render dynamically (the per-request CSP nonce in the root layout rules
// out static generation app-wide), but the stats are read from Redis on every
// hit. Wrap that read in unstable_cache so it's fetched at most once an hour and
// shared across all visitors — keeping the dynamic render cheap.
const cachedDiseaseStats = (slug: string) =>
  unstable_cache(() => getDiseaseStats(slug), ['disease-stats', slug], {
    revalidate: 3600,
  })()

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const info = getDiseaseInfo(slug)
  if (!info) return { title: 'Disease not found — ParvoMaps' }
  return buildMetadata({
    title: `${info.name} in Dogs: Symptoms & Prevention | ParvoMaps`,
    description: info.blurb,
    path: `/diseases/${slug}`,
    type: 'article',
  })
}

const wrap = { maxWidth: 760, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const card = { border: '1px solid var(--border)', borderRadius: 8, padding: 18, background: 'var(--bg-card)' } as const

const SEVERITY_COLOR: Record<DiseaseSeverity, string> = {
  high: 'var(--red)', moderate: 'var(--amber)', low: 'var(--green)', info: '#60a5fa',
}

function fmt(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ ...card, minWidth: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function BarList({ buckets }: { buckets: Bucket[] }) {
  const max = buckets[0]?.count ?? 1
  if (buckets.length === 0) return <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No reports yet.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {buckets.slice(0, 10).map(b => (
        <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 60, fontSize: 12 }}>{b.label}</div>
          <div style={{ flex: 1, height: 8, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(4, (b.count / max) * 100)}%`, height: '100%', background: 'var(--amber)' }} />
          </div>
          <div style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{b.count}</div>
        </div>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{title}</h2>
      {children}
    </div>
  )
}

export default async function DiseasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const info = getDiseaseInfo(slug)
  if (!info) notFound()

  const stats = await cachedDiseaseStats(slug)
  const related = getRelatedDiseases(slug)
  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 } as const

  // FAQ built from this disease's own data — adds useful content + FAQPage rich
  // results, and lifts thin pages above the low-word-count threshold.
  const faqs = [
    { q: `What are the symptoms of ${info.name} in dogs?`, a: `Common signs include ${info.symptoms.join(', ')}. Signs vary by dog and stage — contact your veterinarian if you notice them.` },
    { q: `How do dogs catch ${info.name}?`, a: info.transmission },
    { q: `How can I prevent ${info.name} in dogs?`, a: info.prevention },
    { q: `Is ${info.name} dangerous to dogs?`, a: `${info.name} is considered ${SEVERITY_LABELS[info.severity].toLowerCase()}. ${info.blurb}` },
  ]

  const url = `https://www.parvomaps.us/diseases/${slug}`
  // Schema.org structured data: a MedicalWebPage describing a MedicalCondition,
  // plus breadcrumbs. Makes the page eligible for rich results and gives Google
  // the symptoms/cause/prevention as machine-readable fields. No nonce needed —
  // application/ld+json is data, not executed script, and crawlers ignore CSP.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `${url}#webpage`,
        url,
        name: `${info.name} in Dogs — Symptoms, Spread & Prevention`,
        description: info.blurb,
        inLanguage: 'en-US',
        isPartOf: { '@type': 'WebSite', name: 'ParvoMaps', url: 'https://www.parvomaps.us' },
        about: {
          '@type': 'MedicalCondition',
          name: info.name,
          ...(info.aka ? { alternateName: info.aka } : {}),
          description: info.blurb,
          signOrSymptom: info.symptoms.map(s => ({ '@type': 'MedicalSignOrSymptom', name: s })),
          cause: { '@type': 'MedicalCause', name: info.transmission },
          primaryPrevention: { '@type': 'MedicalTherapy', name: info.prevention },
        },
        audience: { '@type': 'MedicalAudience', audienceType: 'Dog owners and veterinarians' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.parvomaps.us/' },
          { '@type': 'ListItem', position: 2, name: 'Dog Diseases', item: 'https://www.parvomaps.us/diseases' },
          { '@type': 'ListItem', position: 3, name: info.name, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <main style={wrap}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ marginBottom: 20 }}>
        <Link href="/diseases" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← All diseases</Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{info.name}</h1>
        <span style={{ fontSize: 11, fontWeight: 700, color: SEVERITY_COLOR[info.severity], border: `1px solid ${SEVERITY_COLOR[info.severity]}`, borderRadius: 4, padding: '2px 8px' }}>
          {SEVERITY_LABELS[info.severity]}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{CATEGORY_LABELS[info.category]}</span>
      </div>
      {info.aka && <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '0 0 14px' }}>Also known as: {info.aka}</p>}

      <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>{info.blurb}</p>

      {/* Live stats */}
      <Section title="Reported on ParvoMaps">
        <div style={grid3}>
          <StatTile label="All time" value={stats.total} />
          <StatTile label="Last 7 days" value={stats.last7} />
          <StatTile label="Last 30 days" value={stats.last30} />
        </div>
        {stats.byState.length > 0 && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>Top states</div>
            <BarList buckets={stats.byState} />
          </div>
        )}
      </Section>

      <Section title="Symptoms to watch for">
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, listStyleType: 'disc' }}>
          {info.symptoms.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </Section>

      <Section title="How it spreads">
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{info.transmission}</p>
      </Section>

      <Section title="Prevention">
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{info.prevention}</p>
      </Section>

      {stats.recent.length > 0 && (
        <Section title="Recent reports">
          <div style={{ ...card }}>
            {stats.recent.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{[r.city, r.state].filter(Boolean).join(', ') || r.zip || '—'}</span>
                <span style={{ color: 'var(--text-dim)' }}>{fmt(r.timestamp)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section title={`Related ${CATEGORY_LABELS[info.category].toLowerCase()} conditions`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {related.map(r => (
              <Link
                key={r.slug}
                href={`/diseases/${r.slug}`}
                style={{ fontSize: 13, padding: '7px 14px', borderRadius: 6, textDecoration: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}
              >
                {r.name} in dogs →
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="Frequently asked questions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {faqs.map((f, i) => (
            <div key={i}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>{f.q}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '28px 0 24px' }}>
        <Link href="/#report" style={{ padding: '11px 22px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 700, background: 'var(--green)', color: '#04130b' }}>
          Report a case →
        </Link>
        <Link href="/" style={{ padding: '11px 22px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 700, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          View the map
        </Link>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
        Educational information only — not veterinary advice. If you think your dog is sick, contact your veterinarian.
      </p>
    </main>
  )
}
