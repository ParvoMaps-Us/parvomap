'use client'
import { useState } from 'react'

const INFECTIOUS = [
  { key: 'all', label: 'All', color: '#f0f0f0', count: 26 },
  { key: 'parvo', label: 'Parvovirus', color: 'var(--d-parvo)', count: 3 },
  { key: 'distemper', label: 'Distemper', color: 'var(--d-distemper)', count: 3 },
  { key: 'kennel', label: 'Kennel cough', color: 'var(--d-kennel)', count: 3 },
  { key: 'leptospira', label: 'Leptospirosis', color: 'var(--d-leptospira)', count: 2 },
  { key: 'influenza', label: 'Dog Flu', color: 'var(--d-influenza)', count: 2 },
  { key: 'giardia', label: 'Giardia', color: 'var(--d-giardia)', count: 2 },
  { key: 'ringworm', label: 'Ringworm', color: 'var(--d-ringworm)', count: 1 },
  { key: 'brucella', label: 'Brucellosis', color: 'var(--d-brucella)', count: 1 },
]

const ENVIRONMENTAL = [
  { key: 'cyano', label: 'Blue-green algae', color: 'var(--d-cyano)', count: 4 },
]

const TICK = [
  { key: 'lyme', label: 'Lyme Disease', color: 'var(--d-lyme)', count: 3 },
  { key: 'rmsf', label: 'RMSF', color: 'var(--d-rmsf)', count: 2 },
  { key: 'anaplasma', label: 'Anaplasmosis', color: 'var(--d-anaplasma)', count: 1 },
  { key: 'ehrlichia', label: 'Ehrlichiosis', color: 'var(--d-ehrlichia)', count: 1 },
  { key: 'tickspot', label: 'Tick Sighting', color: 'var(--d-tickspot)', count: 3 },
]

export default function FilterBar() {
  const [active, setActive] = useState('all')
  const [showHistorical, setShowHistorical] = useState(true)
  const [showUnverified, setShowUnverified] = useState(true)

  return (
    <nav className="filter-bar" aria-label="Filter map by disease">
      <div className="filter-label">Filter</div>
      <button
        className={`filter-all-btn ${showHistorical ? 'active' : ''}`}
        style={{ marginRight: 4, borderColor: 'rgba(255,255,255,0.1)' }}
        onClick={() => setShowHistorical(h => !h)}
      >
        Historical: {showHistorical ? 'ON' : 'OFF'}
      </button>
      <button
        className={`filter-all-btn ${showUnverified ? 'active' : ''}`}
        style={{ marginRight: 12, borderColor: 'rgba(255,255,255,0.1)' }}
        onClick={() => setShowUnverified(u => !u)}
      >
        Unverified: {showUnverified ? 'ON' : 'OFF'}
      </button>

      <div className="filter-group-label">INFECTIOUS</div>
      {INFECTIOUS.map(d => (
        <button
          key={d.key}
          className={`filter-btn ${active === d.key ? 'active' : ''}`}
          style={{ '--d-color': d.color } as React.CSSProperties}
          onClick={() => setActive(d.key)}
        >
          {d.key !== 'all' && <span className="filter-swatch" style={{ background: d.color }} />}
          {d.label}
          <span className="filter-count">{d.count}</span>
        </button>
      ))}

      <div className="filter-group-label">ENVIRONMENTAL</div>
      {ENVIRONMENTAL.map(d => (
        <button
          key={d.key}
          className={`filter-btn ${active === d.key ? 'active' : ''}`}
          style={{ '--d-color': d.color } as React.CSSProperties}
          onClick={() => setActive(d.key)}
        >
          <span className="filter-swatch" style={{ background: d.color }} />
          {d.label}
          <span className="filter-count">{d.count}</span>
        </button>
      ))}

      <div className="filter-group-label">TICK-BORNE</div>
      {TICK.map(d => (
        <button
          key={d.key}
          className={`filter-btn ${active === d.key ? 'active' : ''}`}
          style={{ '--d-color': d.color } as React.CSSProperties}
          onClick={() => setActive(d.key)}
        >
          <span className="filter-swatch" style={{ background: d.color }} />
          {d.label}
          <span className="filter-count">{d.count}</span>
        </button>
      ))}
    </nav>
  )
}
