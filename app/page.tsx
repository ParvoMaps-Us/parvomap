import Ticker from '@/components/Ticker'
import Header from '@/components/Header'
import StatsBar from '@/components/StatsBar'
import FilterBar from '@/components/FilterBar'
import Map from '@/components/Map'
import ReportForm from '@/components/ReportForm'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Ticker />
      <Header />
      <StatsBar />
      <FilterBar />
      <Map />
      <main id="main-content">
        <ReportForm />
      </main>
      <Footer />
    </>
  )
}
