'use client'
import { useState, useEffect } from 'react'

const INFECTIOUS = [
  { key: 'all', label: 'All', color: '#f0f0f0', count: 28 },
  { key: 'parvo', label: 'Parvovirus', color: 'var(--d-parvo)', count: 3 },
  { key: 'distemper', label: 'Distemper', color: 'var(--d-distemper)', count: 3 },
  { key: 'kennel', label: 'Kennel cough', color: 'var(--d-kennel)', count: 3 },
  { key: 'leptospira', label: 'Leptospirosis', color: 'var(--d-leptospira)', count: 2 },
  { key: 'influenza', label: 'Dog Flu', color: 'var(--d-influenza)', count: 2 },
  { key: 'giardia', label: 'Giardia', color: 'var(--d-giardia)', count: 2 },
  { key: 'ringworm', label: 'Ringworm', color: 'var(--d-ringworm)', count: 1 },
  { key: 'brucella', label: 'Brucellosis', color: 'var(--d-brucella)', count: 1 },
  { key: 'screwworm', label: 'New World Screwworm', color: 'var(--d-screwworm)', count: 1 },
  { key: 'fleas', label: 'Fleas', color: 'var(--d-fleas)', count: 1 },
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

const groupLabelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '8px',
  letterSpacing: '0.14em',
  color: '#777777',
  textTransform: 'uppercase',
  padding: '0 10px 0 16px',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  borderLeft: '1px solid #333333',
  height: '38px',
  display: 'flex',
  alignItems: 'center',
  userSelect: 'none',
}

const firstGroupLabelStyle: React.CSSProperties = {
  ...groupLabelStyle,
  borderLeft: 'none',
  paddingLeft: '14px',
}

export default function FilterBar() {
  const [active, setActive] = useState('all')
  const [showHistorical, setShowHistorical] = useState(true)
  const [showUnverified, setShowUnverified] = useState(true)

  useEffect(() => {
    const bar = document.getElementById('filter-bar')
    if (!bar) return
    const timer = setTimeout(() => {
      bar.scrollTo({ left: 100, behavior: 'smooth' })
      setTimeout(() => bar.scrollTo({ left: 0, behavior: 'smooth' }), 700)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <nav className="filter-bar" id="filter-bar" aria-label="Filter map by disease"
        style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div className="filter-label">Filter</div>
        <button
          className={`filter-all-btn ${showHistorical ? 'active' : ''}`}
          style={{ marginRight: 4, borderColor: '#333' }}
          onClick={() => setShowHistorical(h => !h)}
        >
          Historical: {showHistorical ? 'ON' : 'OFF'}
        </button>
        <button
          className={`filter-all-btn ${showUnverified ? 'active' : ''}`}
          style={{ marginRight: 12, borderColor: '#333' }}
          onClick={() => setShowUnverified(u => !u)}
        >
          Unverified: {showUnverified ? 'ON' : 'OFF'}
        </button>

        <div style={firstGroupLabelStyle} className="filter-group-label-el">INFECTIOUS</div>
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

        <div style={groupLabelStyle} className="filter-group-label-el">TICK-BORNE</div>
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

        <div style={groupLabelStyle} className="filter-group-label-el">ENVIRONMENTAL</div>
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
      </nav>
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '80px',
        background: 'linear-gradient(to right, transparent, #000)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
