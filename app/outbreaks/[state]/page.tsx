import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getStateBySlug, STATES, countyLabel } from '@/lib/states'
import { getStateStats, type Bucket } from '@/lib/dashboard'
import { buildMetadata } from '@/lib/seo'
import { toSlug } from '@/lib/states'
import { wrap, card, StatTile, BarList, Section, ReportCard } from '../ui'

// Same caching stance as the disease pages: the render is dynamic (per-request
// CSP nonce rules out static generation) but the Redis aggregate is shared and
// refreshed hourly, so a burst of visitors to one state costs one read.
const cachedStateStats = (abbr: string) =>
  unstable_cache(() => getStateStats(abbr), ['state-stats', abbr], { revalidate: 3600 })()

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params
  const info = getStateBySlug(state)
  if (!info) return { title: 'State not found — ParvoMaps' }
  return buildMetadata({
    title: `Dog Disease Outbreaks in ${info.name} | ParvoMaps`,
    description: `Current canine disease reports in ${info.name}: parvo, distemper, rabies, leptospirosis, blue-green algae advisories and more, mapped by city and county with sources.`,
    path: `/outbreaks/${info.slug}`,
  })
}

export default async function StateOutbreaksPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params
  const info = getStateBySlug(state)
  if (!info) notFound()

  const stats = await cachedStateStats(info.abbr)
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 } as const

  const topDisease = stats.byDisease[0]
  const url = `https://www.parvomaps.us/outbreaks/${info.slug}`

  const faqs = [
    {
      q: `Is there a dog disease outbreak in ${info.name} right now?`,
      a: stats.active > 0
        ? `ParvoMaps is currently tracking ${stats.active} active report${stats.active === 1 ? '' : 's'} in ${info.name}${topDisease ? `, most commonly ${topDisease.label.toLowerCase()}` : ''}. Reports stay marked active for a set window per disease, then move to historical.`
        : `ParvoMaps has no active reports in ${info.name} at the moment. That means nothing recent has been reported or confirmed here, not that risk is zero — keep vaccinations current and check back before travel.`,
    },
    {
      q: `What dog diseases have been reported in ${info.name}?`,
      a: stats.byDisease.length
        ? `Reports in ${info.name} cover ${stats.byDisease.slice(0, 5).map(b => b.label.toLowerCase()).join(', ')}${stats.byDisease.length > 5 ? ' and others' : ''}, drawn from news coverage, health department notices and community reports.`
        : `No cases have been reported in ${info.name} yet. You can submit one if you know of a confirmed case.`,
    },
    {
      q: `How do I know if a report near me is still current?`,
      a: `Every report carries the date it happened and a link to its source. Each disease has its own active window — blue-green algae advisories expire in 30 days, parvo reports stay active for a year — so a pin marked active is one still worth acting on.`,
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: `Dog Disease Outbreaks in ${info.name}`,
        description: `Canine disease reports across ${info.name}, mapped by city and county with sources.`,
        inLanguage: 'en-US',
        isPartOf: { '@type': 'WebSite', name: 'ParvoMaps', url: 'https://www.parvomaps.us' },
        about: { '@type': 'Place', name: info.name, address: { '@type': 'PostalAddress', addressRegion: info.abbr, addressCountry: 'US' } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.parvomaps.us/' },
          { '@type': 'ListItem', position: 2, name: 'Outbreaks', item: 'https://www.parvomaps.us/outbreaks' },
          { '@type': 'ListItem', position: 3, name: info.name, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  }

  // Linking every state page to all the others keeps each one a single click
  // from the rest, so crawl depth spreads instead of stranding 50 leaf pages.
  const others = STATES.filter(s => s.abbr !== info.abbr)

  return (
    <main style={wrap}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ marginBottom: 16 }}>
        <Link href="/outbreaks" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← All states</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Dog Disease Outbreaks in {info.name}</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
        {stats.total === 0 ? (
          <>No confirmed reports in {info.name} yet. If you know of a case, you can{' '}
            <Link href="/" style={{ color: 'var(--green)' }}>add it to the map</Link>. Coverage grows from news
            reports, health department notices and dog owners like you.</>
        ) : (
          <>ParvoMaps is tracking <strong>{stats.total}</strong> confirmed report{stats.total === 1 ? '' : 's'} in {info.name}
            {stats.active > 0 ? <>, <strong>{stats.active}</strong> of them still active</> : ', none currently active'}.
            Every report links to its source. See them plotted on the{' '}
            <Link href="/" style={{ color: 'var(--green)' }}>live map</Link>.</>
        )}
      </p>

      <div style={{ ...grid, marginBottom: 28 }}>
        <StatTile label="Reports on record" value={stats.total} />
        <StatTile label="Currently active" value={stats.active} />
        <StatTile label="Last 7 days" value={stats.last7} />
        <StatTile label="Last 30 days" value={stats.last30} />
      </div>

      {stats.byDisease.length > 0 && (
        <Section title={`What's been reported in ${info.name}`}>
          <div style={card}>
            <BarList
              buckets={stats.byDisease}
              hrefFor={b => `/outbreaks/${info.slug}/${b.key}`}
            />
          </div>
        </Section>
      )}

      {stats.byCounty.length > 0 && (
        <Section title="Where in the state">
          <div style={card}><BarList buckets={stats.byCounty} hrefFor={b => `/outbreaks/${info.slug}/${toSlug(b.key)}`} /></div>
        </Section>
      )}

      {stats.recent.length > 0 && (
        <Section title="Recent reports">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.recent.map((r, i) => <ReportCard key={r.id ?? i} r={r} countyText={countyLabel(r.county, r.state)} />)}
          </div>
        </Section>
      )}

      <Section title="Common questions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map(f => (
            <div key={f.q} style={card}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{f.q}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Other states">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {others.map(s => (
            <Link key={s.abbr} href={`/outbreaks/${s.slug}`}
                  style={{ fontSize: 12, color: 'var(--text-dim)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px' }}>
              {s.name}
            </Link>
          ))}
        </div>
      </Section>
    </main>
  )
}
