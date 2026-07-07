'use client'
import { useState, useEffect, useMemo } from 'react'
import type { Report } from '@/lib/redis'

// Disease chips per category. Counts are computed live from the reports on the
// map (see `counts` below) — never hardcoded, so they can't drift.
const INFECTIOUS = [
  { key: 'all', label: 'All', color: '#f0f0f0' },
  { key: 'parvo', label: 'Parvovirus', color: 'var(--d-parvo)' },
  { key: 'distemper', label: 'Distemper', color: 'var(--d-distemper)' },
  { key: 'kennel', label: 'Kennel cough', color: 'var(--d-kennel)' },
  { key: 'leptospira', label: 'Leptospirosis', color: 'var(--d-leptospira)' },
  { key: 'influenza', label: 'Dog Flu', color: 'var(--d-influenza)' },
  { key: 'strepzoo', label: 'Strep Zoo', color: 'var(--d-strepzoo)' },
  { key: 'giardia', label: 'Giardia', color: 'var(--d-giardia)' },
  { key: 'ringworm', label: 'Ringworm', color: 'var(--d-ringworm)' },
  { key: 'brucella', label: 'Brucellosis', color: 'var(--d-brucella)' },
  { key: 'screwworm', label: 'New World Screwworm', color: 'var(--d-screwworm)' },
  { key: 'rabies', label: 'Rabies', color: 'var(--d-rabies)' },
  { key: 'fleas', label: 'Fleas', color: 'var(--d-fleas)' },
]

const ENVIRONMENTAL = [
  { key: 'cyano', label: 'Blue-green algae', color: 'var(--d-cyano)' },
]

const TICK = [
  { key: 'lyme', label: 'Lyme Disease', color: 'var(--d-lyme)' },
  { key: 'rmsf', label: 'RMSF', color: 'var(--d-rmsf)' },
  { key: 'anaplasma', label: 'Anaplasmosis', color: 'var(--d-anaplasma)' },
  { key: 'ehrlichia', label: 'Ehrlichiosis', color: 'var(--d-ehrlichia)' },
  { key: 'tickspot', label: 'Tick Sighting', color: 'var(--d-tickspot)' },
]

const groupLabelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '8px',
  letterSpacing: '0.14em',
  color: '#999999',
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

export default function FilterBar({ reports = [] }: { reports?: Report[] }) {
  const [active, setActive] = useState('all')
  const [showHistorical, setShowHistorical] = useState(true)
  const [showUnverified, setShowUnverified] = useState(true)

  // Live per-disease counts from the actual reports on the map.
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const r of reports) {
      if (r.kind === 'lost') continue
      c[r.disease] = (c[r.disease] ?? 0) + 1
    }
    return c
  }, [reports])
  const countFor = (key: string) => (key === 'all' ? reports.filter(r => r.kind !== 'lost').length : counts[key] ?? 0)

  // Broadcast the current filter to the map (which listens for this event and
  // re-renders its pins). Fires on mount and on every change.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('parvomap:filter', {
        detail: { disease: active, showHistorical, showUnverified },
      }),
    )
  }, [active, showHistorical, showUnverified])

  useEffect(() => {
    const bar = document.getElementById('filter-bar')
    if (!bar) return
    const timer = setTimeout(() => {
      bar.scrollTo({ left: 100, behavior: 'smooth' })
      setTimeout(() => bar.scrollTo({ left: 0, behavior: 'smooth' }), 700)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  const renderChip = (d: { key: string; label: string; color: string }) => (
    <button
      key={d.key}
      className={`filter-btn ${active === d.key ? 'active' : ''}`}
      style={{ '--d-color': d.color } as React.CSSProperties}
      onClick={() => setActive(d.key)}
    >
      {d.key !== 'all' && <span className="filter-swatch" style={{ background: d.color }} />}
      {d.label}
      <span className="filter-count">{countFor(d.key)}</span>
    </button>
  )

  return (
    <div className="filter-bar-wrap">
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
        {INFECTIOUS.map(renderChip)}

        <div style={groupLabelStyle} className="filter-group-label-el">TICK-BORNE</div>
        {TICK.map(renderChip)}

        <div style={groupLabelStyle} className="filter-group-label-el">ENVIRONMENTAL</div>
        {ENVIRONMENTAL.map(renderChip)}
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
