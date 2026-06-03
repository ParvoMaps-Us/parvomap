import Ticker from '@/components/Ticker'
import Header from '@/components/Header'
import StatsBar from '@/components/StatsBar'
import FilterBar from '@/components/FilterBar'
import Map from '@/components/Map'
import ReportForm from '@/components/ReportForm'
import Footer from '@/components/Footer'
import { getStats } from '@/lib/redis'

export default async function HomePage() {
  let stats = { last30: 0, last7: 0, last48: 0, states: 0 }

  try {
    stats = await getStats()
  } catch (e) {
    console.error('Redis not available:', e)
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Ticker />
      <Header />
      <StatsBar {...stats} />
      <FilterBar />
      <Map />
      <main id="main-content">
        <ReportForm />
      </main>
      <Footer />
    </>
  )
}
