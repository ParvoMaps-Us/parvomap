import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getStateBySlug, countyLabel } from '@/lib/states'
import { getCountyStats, getStateDiseaseStats } from '@/lib/dashboard'
import { DISEASE_MAP } from '@/lib/diseases'
import { buildMetadata } from '@/lib/seo'
import { wrap, StatTile, BarList, Section, ReportCard, jsonLdSafe } from '../../ui'

// One dynamic segment serves two page kinds, disambiguated by slug:
//   /outbreaks/texas/parvo        -> disease-in-state (slug is a disease key)
//   /outbreaks/texas/bexar        -> county (anything else)
// Disease keys are a fixed known set with no county-name collisions.

const cachedCounty = (abbr: string, slug: string) =>
  unstable_cache(() => getCountyStats(abbr, slug), ['county-stats', abbr, slug], { revalidate: 3600 })()
const cachedStateDisease = (abbr: string, key: string) =>
  unstable_cache(() => getStateDiseaseStats(abbr, key), ['state-disease-stats', abbr, key], { revalidate: 3600 })()

interface Params { state: string; county: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { state, county } = await params
  const info = getStateBySlug(state)
  if (!info) return { title: 'Not found — ParvoMaps' }
  const slug = county.toLowerCase()

  if (DISEASE_MAP[slug]) {
    const d = DISEASE_MAP[slug]
    const stats = await cachedStateDisease(info.abbr, slug)
    return {
      ...buildMetadata({
        title: `${d.name} in ${info.name}: Current Reports | ParvoMaps`,
        description: `Where ${d.name.toLowerCase()} is being reported in ${info.name} right now — confirmed cases by city and county, each linked to its source.`,
        path: `/outbreaks/${info.slug}/${slug}`,
      }),
      // A combo with no data yet is a thin page; keep it crawlable but unindexed
      // until it earns content. It starts indexing the day a case lands.
      ...(stats.total === 0 ? { robots: { index: false, follow: true } } : {}),
    }
  }

  const stats = await cachedCounty(info.abbr, slug)
  if (stats.total === 0) return { title: 'Not found — ParvoMaps' }
  const label = countyLabel(stats.countyName, info.abbr) ?? slug
  return buildMetadata({
    title: `Dog Disease Reports in ${label}, ${info.abbr} | ParvoMaps`,
    description: `Confirmed canine disease reports in ${label}, ${info.name}, with dates and sources: parvo, rabies, distemper, algae advisories and more.`,
    path: `/outbreaks/${info.slug}/${slug}`,
  })
}

export default async function CountyOrDiseasePage({ params }: { params: Promise<Params> }) {
  const { state, county } = await params
  const info = getStateBySlug(state)
  if (!info) notFound()
  const slug = county.toLowerCase()
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 } as const

  // ---- Disease-in-state ----
  if (DISEASE_MAP[slug]) {
    const d = DISEASE_MAP[slug]
    const stats = await cachedStateDisease(info.abbr, slug)
    const url = `https://www.parvomaps.us/outbreaks/${info.slug}/${slug}`
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage', '@id': `${url}#webpage`, url,
          name: `${d.name} in ${info.name}`,
          description: `Confirmed ${d.name.toLowerCase()} reports in ${info.name} with dates and sources.`,
          inLanguage: 'en-US',
          isPartOf: { '@type': 'WebSite', name: 'ParvoMaps', url: 'https://www.parvomaps.us' },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.parvomaps.us/' },
            { '@type': 'ListItem', position: 2, name: 'Outbreaks', item: 'https://www.parvomaps.us/outbreaks' },
            { '@type': 'ListItem', position: 3, name: info.name, item: `https://www.parvomaps.us/outbreaks/${info.slug}` },
            { '@type': 'ListItem', position: 4, name: d.name, item: url },
          ],
        },
      ],
    }

    return (
      <main style={wrap}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(jsonLd) }} />
        <div style={{ marginBottom: 16 }}>
          <Link href={`/outbreaks/${info.slug}`} style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← {info.name}</Link>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>{d.name} in {info.name}</h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
          {stats.total === 0
            ? <>No confirmed {d.name.toLowerCase()} reports in {info.name} yet. Statewide activity for other diseases is on the{' '}
                <Link href={`/outbreaks/${info.slug}`} style={{ color: 'var(--green)' }}>{info.name} page</Link>, and you can{' '}
                <Link href="/" style={{ color: 'var(--green)' }}>report a case</Link> if you know of one.</>
            : <>{stats.total} confirmed {d.name.toLowerCase()} report{stats.total === 1 ? '' : 's'} in {info.name}
                {stats.active > 0 ? <>, <strong>{stats.active}</strong> still active</> : ', none currently active'}.
                About this disease: <Link href={`/diseases/${slug}`} style={{ color: 'var(--green)' }}>symptoms and prevention</Link>.</>}
        </p>
        <div style={{ ...grid, marginBottom: 28 }}>
          <StatTile label="Reports on record" value={stats.total} />
          <StatTile label="Currently active" value={stats.active} />
          <StatTile label="Last 7 days" value={stats.last7} />
          <StatTile label="Last 30 days" value={stats.last30} />
        </div>
        {stats.byCounty.length > 0 && (
          <Section title="Where in the state"><div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 18, background: 'var(--bg-card)' }}>
            <BarList buckets={stats.byCounty} hrefFor={b => `/outbreaks/${info.slug}/${b.key.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, '-')}`} />
          </div></Section>
        )}
        {stats.recent.length > 0 && (
          <Section title="Recent reports">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.recent.map((r, i) => <ReportCard key={r.id ?? i} r={r} countyText={countyLabel(r.county, r.state)} />)}
            </div>
          </Section>
        )}
      </main>
    )
  }

  // ---- County ----
  const stats = await cachedCounty(info.abbr, slug)
  if (stats.total === 0) notFound()
  const label = countyLabel(stats.countyName, info.abbr) ?? slug
  const url = `https://www.parvomaps.us/outbreaks/${info.slug}/${slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage', '@id': `${url}#webpage`, url,
        name: `Dog Disease Reports in ${label}, ${info.abbr}`,
        description: `Confirmed canine disease reports in ${label}, ${info.name}, with dates and sources.`,
        inLanguage: 'en-US',
        isPartOf: { '@type': 'WebSite', name: 'ParvoMaps', url: 'https://www.parvomaps.us' },
        about: { '@type': 'Place', name: `${label}, ${info.name}`, address: { '@type': 'PostalAddress', addressRegion: info.abbr, addressCountry: 'US' } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.parvomaps.us/' },
          { '@type': 'ListItem', position: 2, name: 'Outbreaks', item: 'https://www.parvomaps.us/outbreaks' },
          { '@type': 'ListItem', position: 3, name: info.name, item: `https://www.parvomaps.us/outbreaks/${info.slug}` },
          { '@type': 'ListItem', position: 4, name: label, item: url },
        ],
      },
    ],
  }

  return (
    <main style={wrap}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(jsonLd) }} />
      <div style={{ marginBottom: 16 }}>
        <Link href={`/outbreaks/${info.slug}`} style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← {info.name}</Link>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Dog Disease Reports in {label}, {info.abbr}</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
        {stats.total} confirmed report{stats.total === 1 ? '' : 's'} in {label}
        {stats.active > 0 ? <>, <strong>{stats.active}</strong> still active</> : ', none currently active'}.
        Each links to its source. See the <Link href="/" style={{ color: 'var(--green)' }}>live map</Link> for exact locations.
      </p>
      <div style={{ ...grid, marginBottom: 28 }}>
        <StatTile label="Reports on record" value={stats.total} />
        <StatTile label="Currently active" value={stats.active} />
        <StatTile label="Last 7 days" value={stats.last7} />
        <StatTile label="Last 30 days" value={stats.last30} />
      </div>
      {stats.byDisease.length > 0 && (
        <Section title={`What's been reported in ${label}`}><div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 18, background: 'var(--bg-card)' }}>
          <BarList buckets={stats.byDisease} hrefFor={b => `/outbreaks/${info.slug}/${b.key}`} />
        </div></Section>
      )}
      {stats.recent.length > 0 && (
        <Section title="Recent reports">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.recent.map((r, i) => <ReportCard key={r.id ?? i} r={r} countyText={countyLabel(r.county, r.state)} />)}
          </div>
        </Section>
      )}
    </main>
  )
}
