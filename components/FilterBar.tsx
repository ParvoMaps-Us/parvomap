'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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

type Chip = { key: string; label: string; color: string }

// Flat lookup of every real disease (excludes the 'all' sentinel). Used to pick
// the highest-volume chips for the inline row and to resolve the active one.
const ALL_DISEASES: Chip[] = [...INFECTIOUS.filter(d => d.key !== 'all'), ...TICK, ...ENVIRONMENTAL]
const DISEASE_BY_KEY: Record<string, Chip> = Object.fromEntries(ALL_DISEASES.map(d => [d.key, d]))

// How many live-volume chips to surface inline before the rest fall under More.
const INLINE_COUNT = 3

// Short labels for the cramped inline row (the dropdown uses full names).
const SHORT_LABEL: Record<string, string> = {
  parvo: 'Parvo', distemper: 'Distemper', kennel: 'Kennel', leptospira: 'Lepto',
  influenza: 'Flu', strepzoo: 'Strep', giardia: 'Giardia', ringworm: 'Ringworm',
  brucella: 'Brucella', screwworm: 'Screwworm', rabies: 'Rabies', fleas: 'Fleas',
  cyano: 'Cyano', lyme: 'Lyme', rmsf: 'RMSF', anaplasma: 'Anaplasma',
  ehrlichia: 'Ehrlichia', tickspot: 'Ticks',
}

const menuGroupLabelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '8px',
  letterSpacing: '0.14em',
  color: '#888',
  textTransform: 'uppercase',
  margin: '2px 0 8px',
  userSelect: 'none',
}

export default function FilterBar({ reports = [] }: { reports?: Report[] }) {
  const [active, setActive] = useState('all')
  const [showHistorical, setShowHistorical] = useState(true)
  const [showUnverified, setShowUnverified] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Live per-disease counts from the actual reports on the map.
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const r of reports) {
      if (r.kind === 'lost') continue
      c[r.disease] = (c[r.disease] ?? 0) + 1
    }
    return c
  }, [reports])
  const totalCount = useMemo(() => reports.filter(r => r.kind !== 'lost').length, [reports])
  const countFor = (key: string) => (key === 'all' ? totalCount : counts[key] ?? 0)

  // The inline chips: the highest-volume diseases right now, so the visible
  // filters are always the active outbreaks. The long tail lives under More.
  const inlineChips = useMemo(
    () =>
      ALL_DISEASES.map(d => ({ ...d, n: counts[d.key] ?? 0 }))
        .filter(d => d.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, INLINE_COUNT),
    [counts],
  )
  const inlineKeys = useMemo(() => new Set(['all', ...inlineChips.map(d => d.key)]), [inlineChips])

  // Broadcast the current filter to the map (which listens for this event and
  // re-renders its pins). Fires on mount and on every change.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('parvomap:filter', {
        detail: { disease: active, showHistorical, showUnverified },
      }),
    )
  }, [active, showHistorical, showUnverified])

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const select = (key: string) => { setActive(key); setMenuOpen(false) }

  const renderChip = (d: Chip, short = false) => (
    <button
      key={d.key}
      className={`filter-btn ${active === d.key ? 'active' : ''}`}
      style={{ '--d-color': d.color } as React.CSSProperties}
      onClick={() => select(d.key)}
    >
      {d.key !== 'all' && <span className="filter-swatch" style={{ background: d.color }} />}
      {short ? SHORT_LABEL[d.key] ?? d.label : d.label}
      <span className="filter-count">{countFor(d.key)}</span>
    </button>
  )

  const menuGroup = (label: string, items: Chip[]) => (
    <div style={{ marginBottom: 12 }}>
      <div style={menuGroupLabelStyle}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{items.map(d => renderChip(d))}</div>
    </div>
  )

  // If the active disease isn't one of the inline chips (picked from More), pin
  // it inline too so the current filter is always visible.
  const activeOverflow = active !== 'all' && !inlineKeys.has(active) ? DISEASE_BY_KEY[active] : undefined

  return (
    <div className="filter-bar-wrap" ref={wrapRef}>
      <nav className="filter-bar" id="filter-bar" aria-label="Filter map by disease"
        style={{ overflowX: 'hidden', scrollbarWidth: 'none' }}>
        <div className="filter-label">Filter</div>
        {renderChip({ key: 'all', label: 'All', color: '#f0f0f0' }, true)}
        {inlineChips.map(d => renderChip(d, true))}
        {activeOverflow && renderChip(activeOverflow, true)}
        <button
          className={`filter-menu-toggle ${menuOpen ? 'active' : ''}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          More
          <span style={{ fontSize: 8, display: 'inline-block', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
        </button>
      </nav>

      {menuOpen && (
        <div
          role="menu"
          aria-label="Filter map by disease"
          style={{
            position: 'absolute',
            top: '100%',
            left: 8,
            width: 'min(420px, calc(100vw - 16px))',
            maxHeight: '70vh',
            overflowY: 'auto',
            background: '#0a0a0a',
            border: '1px solid #333',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            padding: '14px 16px 16px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
            zIndex: 1600,
          }}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              className={`filter-all-btn ${showHistorical ? 'active' : ''}`}
              style={{ borderColor: '#333' }}
              onClick={() => setShowHistorical(h => !h)}
            >
              Historical: {showHistorical ? 'ON' : 'OFF'}
            </button>
            <button
              className={`filter-all-btn ${showUnverified ? 'active' : ''}`}
              style={{ borderColor: '#333' }}
              onClick={() => setShowUnverified(u => !u)}
            >
              Unverified: {showUnverified ? 'ON' : 'OFF'}
            </button>
          </div>
          {menuGroup('Infectious', INFECTIOUS)}
          {menuGroup('Tick-borne', TICK)}
          {menuGroup('Environmental', ENVIRONMENTAL)}
        </div>
      )}
    </div>
  )
}
