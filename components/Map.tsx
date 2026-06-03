'use client'
import dynamic from 'next/dynamic'
import type { Report } from '@/lib/redis'

const DISEASE_COLORS: Record<string, string> = {
  parvo: '#ef4444',
  distemper: '#f97316',
  kennel: '#eab308',
  leptospira: '#84cc16',
  influenza: '#06b6d4',
  giardia: '#8b5cf6',
  ringworm: '#ec4899',
  brucella: '#f43f5e',
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
    <section className="map-section" aria-label="US canine disease outbreak map" style={{ position: 'relative' }}>
      <div className="map-label">Live Outbreak Map · US</div>

      <div style={{ position: 'absolute', inset: 0 }}>
        <LeafletMap reports={reports} pinColor={pinColor} recencyClass={recencyClass} />

        {reports.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '11px',
              color: '#888888',
              fontSize: '13px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              No reports yet
            </div>
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '9px',
              color: '#666666',
              letterSpacing: '0.08em',
            }}>
              Be the first to report a case
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Map Key</div>
        <div className="legend-section">
          <div className="legend-section-title">Recency</div>
          <div className="legend-item"><div className="legend-dot red" /> Last 48h</div>
          <div className="legend-item"><div className="legend-dot amber" /> Last 7 days</div>
          <div className="legend-item"><div className="legend-dot green" /> Last 30 days</div>
          <div className="legend-item"><div className="legend-dot gray" /> Historical</div>
        </div>
      </div>
    </section>
  )
}
