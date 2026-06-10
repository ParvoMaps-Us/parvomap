import Link from 'next/link'
import { hasCurrentRecall } from '@/lib/recalls'

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
        <Link href="/recalls" className="nav-link recall-tab">
          Recalls{recallActive && <span className="recall-dot" aria-hidden="true" />}
        </Link>
        <Link href="/alerts" className="nav-link">Alerts</Link>
        <Link href="/pro" className="nav-link">Pro</Link>
        <a href="#report" className="btn-report">+ Report a Case</a>
        <Link href="/account" className="nav-link" aria-label="Account & billing" title="Account & billing" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </Link>
      </nav>
    </header>
  )
}
