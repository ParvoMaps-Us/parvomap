'use client'
import dynamic from 'next/dynamic'
import type { Report } from '@/lib/redis'
import { getDiseaseName } from '@/lib/diseases'

const DISEASE_COLORS: Record<string, string> = {
  parvo: '#ef4444',
  distemper: '#f97316',
  kennel: '#eab308',
  leptospira: '#84cc16',
  influenza: '#06b6d4',
  giardia: '#8b5cf6',
  ringworm: '#ec4899',
  brucella: '#f43f5e',
  screwworm: '#fb7185',
  fleas: '#9a3412',
  cyano: '#14b8a6',
  lyme: '#22c55e',
  rmsf: '#fb923c',
  anaplasma: '#a78bfa',
  ehrlichia: '#f472b6',
  tickspot: '#facc15',
}

function pinColor(report: Report): string {
  return DISEASE_COLORS[report.disease] ?? '#888'
}

function recencyClass(timestamp: number): string {
  const age = Date.now() - timestamp
  if (age < 48 * 60 * 60 * 1000) return 'red'
  if (age < 7 * 24 * 60 * 60 * 1000) return 'amber'
  return 'green'
}

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false })

interface MapProps {
  reports?: Report[]
}

export default function Map({ reports = [] }: MapProps) {
  return (
    <section className="map-section" aria-label="US canine disease outbreak map">
      <div className="map-label">Live Outbreak Map · US</div>

      {/* Screen-reader text alternative to the visual map — the canvas/markers
          aren't perceivable to assistive tech, so expose the same reports as a
          plain list. */}
      <div className="sr-only">
        <h2>Reported cases on the map</h2>
        {reports.length === 0 ? (
          <p>No reports yet.</p>
        ) : (
          <ul>
            {reports.map(r => {
              const where = [r.city, r.state].filter(Boolean).join(', ') || r.zip || 'location not specified'
              const what = r.kind === 'lost'
                ? `Lost dog${r.dogName ? ` named ${r.dogName}` : ''}`
                : getDiseaseName(r.disease)
              const when = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              return <li key={r.id}>{what} — {where} — reported {when}</li>
            })}
          </ul>
        )}
      </div>

      <LeafletMap reports={reports} pinColor={pinColor} recencyClass={recencyClass} />
    </section>
  )
}
