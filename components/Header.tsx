import Link from 'next/link'

export default function Header() {
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
        <Link href="/alerts" className="nav-link">Alerts</Link>
        <Link href="/pro" className="nav-link">Pro</Link>
        <a href="#report" className="btn-report">+ Report a Case</a>
      </nav>
    </header>
  )
}
