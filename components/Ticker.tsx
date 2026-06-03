import type { Report } from '@/lib/redis'

interface TickerProps {
  reports: Report[]
}

export default function Ticker({ reports }: TickerProps) {
  if (reports.length === 0) return null

  const DISEASE_LABELS: Record<string, string> = {
    parvo: 'Parvovirus', distemper: 'Distemper', kennel: 'Kennel Cough',
    leptospira: 'Leptospirosis', influenza: 'Dog Flu', giardia: 'Giardia',
    ringworm: 'Ringworm', brucella: 'Brucellosis', cyano: 'Blue-green Algae',
    lyme: 'Lyme Disease', rmsf: 'RMSF', anaplasma: 'Anaplasmosis',
    ehrlichia: 'Ehrlichiosis', tickspot: 'Tick Sighting',
  }

  function ageLabel(timestamp: number): string {
    const age = Date.now() - timestamp
    if (age < 60 * 60 * 1000) return `${Math.round(age / 60000)}m ago`
    if (age < 24 * 60 * 60 * 1000) return `${Math.round(age / 3600000)}h ago`
    return `${Math.round(age / 86400000)}d ago`
  }

  // Double items for seamless scroll loop
  const allItems = [...reports, ...reports]

  return (
    <div className="ticker-wrap">
      <div className="ticker-label">Live Reports</div>
      <div className="ticker-track">
        {allItems.map((r, i) => (
          <span key={i}>
            ZIP <b>{r.zip}</b> · {r.city ?? r.state} · {DISEASE_LABELS[r.disease] ?? r.disease} · <em>{ageLabel(r.timestamp)}</em>
          </span>
        ))}
      </div>
    </div>
  )
}
