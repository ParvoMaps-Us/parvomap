import Link from 'next/link'
import Ticker from '@/components/Ticker'
import Header from '@/components/Header'
import StatsBar from '@/components/StatsBar'
import FilterBar from '@/components/FilterBar'
import Map from '@/components/Map'
import ReportForm from '@/components/ReportForm'
import Footer from '@/components/Footer'
import VerifiedBanner from '@/components/VerifiedBanner'
import WelcomePopup from '@/components/WelcomePopup'
import { getReports, getStats } from '@/lib/redis'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; removed?: string }>
}) {
  const { verified, removed } = await searchParams

  let stats = { last30: 0, last7: 0, last48: 0, states: 0, topDisease: '', topStates: '' }
  let reports: Awaited<ReturnType<typeof getReports>> = []

  try {
    ;[stats, reports] = await Promise.all([getStats(), getReports({ limit: 100 })])
  } catch (e) {
    console.error('Redis not available:', e)
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Document heading — the visual brand is the logo, so the page h1 is
          screen-reader-only. Comes before the map's h2 to keep heading order. */}
      <h1 className="sr-only">ParvoMaps — Live US canine disease outbreak map</h1>
      <WelcomePopup />
      {verified && <VerifiedBanner status={verified} />}
      {removed && <VerifiedBanner status={removed} param="removed" />}
      {reports.length > 0 && <Ticker reports={reports} />}
      <Header />
      <StatsBar {...stats} />
      <FilterBar />
      <Map reports={reports} />
      <main id="main-content">
        {stats.last48 > 0 && (
          <div className="alert-strip">
            <span className="alert-icon">⚠ Outbreak Alert</span>
            <span className="alert-text">
              <strong style={{ textTransform: 'capitalize' }}>{stats.topDisease} elevated</strong>
              {' '}— {stats.last48} report{stats.last48 !== 1 ? 's' : ''} in the last 48 hours
              {stats.topStates ? ` across ${stats.topStates}` : ''}.
            </span>
          </div>
        )}
        <ReportForm />

        {/* Contextual internal links — give the homepage real in-content links to
            the hubs and headline disease pages (SEO: un-orphans content, spreads
            crawl equity from the highest-authority page). */}
        <section aria-label="Explore ParvoMaps" className="home-explore" style={{ maxWidth: 900, margin: '8px auto 0', padding: '24px', fontFamily: 'var(--mono)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Track dog diseases near you</h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.8, margin: '0 0 14px' }}>
            ParvoMaps maps canine disease outbreaks across the US. Browse{' '}
            <Link href="/diseases" style={{ color: 'var(--green)' }}>all tracked diseases</Link>, see{' '}
            <Link href="/outbreaks" style={{ color: 'var(--green)' }}>outbreaks by state</Link>, check{' '}
            <Link href="/recalls" style={{ color: 'var(--green)' }}>dog food recalls</Link>, or{' '}
            <Link href="/alerts" style={{ color: 'var(--green)' }}>set up outbreak alerts</Link>.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['parvo', 'Parvovirus'], ['distemper', 'Distemper'], ['lyme', 'Lyme disease'],
              ['kennel', 'Kennel cough'], ['rabies', 'Rabies'], ['leptospira', 'Leptospirosis'],
              ['rmsf', 'Rocky Mountain spotted fever'], ['cyano', 'Blue-green algae'],
            ].map(([slug, name]) => (
              <Link key={slug} href={`/diseases/${slug}`} style={{ fontSize: 13, padding: '7px 14px', borderRadius: 6, textDecoration: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
                {name} in dogs →
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
