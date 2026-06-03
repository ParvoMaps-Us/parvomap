'use client'
import dynamic from 'next/dynamic'
import type { Report } from '@/lib/redis'

// TODO: remove demo pins before production launch
const DEMO_PINS: Report[] = [
  { id: 'd1', disease: 'parvo', zip: '90210', state: 'CA', city: 'Beverly Hills, CA', lat: 34.09, lng: -118.41, timestamp: Date.now() - 2 * 60 * 60 * 1000, verified: true },
  { id: 'd2', disease: 'parvo', zip: '77001', state: 'TX', city: 'Houston, TX', lat: 29.76, lng: -95.37, timestamp: Date.now() - 18 * 60 * 60 * 1000, verified: true },
  { id: 'd3', disease: 'distemper', zip: '63101', state: 'MO', city: 'St. Louis, MO', lat: 38.63, lng: -90.20, timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000, verified: true },
  { id: 'd4', disease: 'kennel', zip: '60601', state: 'IL', city: 'Chicago, IL', lat: 41.88, lng: -87.63, timestamp: Date.now() - 3 * 60 * 60 * 1000, verified: true },
  { id: 'd5', disease: 'influenza', zip: '98101', state: 'WA', city: 'Seattle, WA', lat: 47.61, lng: -122.33, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, verified: true },
  { id: 'd6', disease: 'kennel', zip: '80201', state: 'CO', city: 'Denver, CO', lat: 39.74, lng: -104.99, timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, verified: true },
  { id: 'd7', disease: 'leptospira', zip: '85001', state: 'AZ', city: 'Phoenix, AZ', lat: 33.45, lng: -112.07, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, verified: true },
  { id: 'd8', disease: 'giardia', zip: '33101', state: 'FL', city: 'Miami, FL', lat: 25.77, lng: -80.19, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, verified: true },
  { id: 'd9', disease: 'lyme', zip: '06001', state: 'CT', city: 'Avon, CT', lat: 41.79, lng: -72.86, timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, verified: true },
  { id: 'd10', disease: 'rmsf', zip: '85001', state: 'AZ', city: 'Phoenix, AZ', lat: 33.48, lng: -112.04, timestamp: Date.now() - 5 * 60 * 60 * 1000, verified: true },
  { id: 'd11', disease: 'tickspot', zip: '80401', state: 'CO', city: 'Golden, CO', lat: 39.76, lng: -105.22, timestamp: Date.now() - 24 * 60 * 60 * 1000, verified: true },
  { id: 'd12', disease: 'parvo', zip: '30301', state: 'GA', city: 'Atlanta, GA', lat: 33.75, lng: -84.39, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, verified: true },
]

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

export default function Map({ reports = DEMO_PINS }: MapProps) {
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
              color: '#444',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              No reports yet
            </div>
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '9px',
              color: '#333',
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
