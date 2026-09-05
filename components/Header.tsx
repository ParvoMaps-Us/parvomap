import Link from 'next/link'
import { hasCurrentRecall } from '@/lib/recalls'
import MobileMenu from './MobileMenu'
import OutbreaksNav from './OutbreaksNav'
import ProCta from './ProCta'
import { PAID_ALERTS_LIVE } from '@/lib/flags'

export default async function Header() {
  const recallActive = await hasCurrentRecall()
  return (
    <header role="banner">
      <div className="logo-group">
        <div className="logo">
          Parvo<span style={{ color: '#f0f0f0' }}>Maps</span>{' '}
          <span className="logo-dot" />
        </div>
        <div className="logo-tag header-tagline">US Canine Disease Tracker</div>
      </div>
      <nav>
        <Link href="/diseases" className="nav-link">Diseases</Link>
        <OutbreaksNav />
        <Link href="/recalls" className="nav-link recall-tab">
          Recalls{recallActive && <span className="recall-dot" aria-hidden="true" />}
        </Link>
        {PAID_ALERTS_LIVE && <Link href="/alerts" className="nav-link">Alerts</Link>}
        <Link href="/blog" className="nav-link">Blog</Link>
        <a href="#report" className="btn-report">+ Report a Case</a>
        <ProCta location="header" />
        <MobileMenu recallActive={recallActive} />
      </nav>
    </header>
  )
}
