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
      </main>
      <Footer />
    </>
  )
}
