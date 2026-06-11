'use client'
import { useEffect, useRef, useState } from 'react'

export interface PlaceSelection {
  label: string
  lat: number
  lng: number
}

interface Suggestion {
  label: string
  lat: number
  lng: number
}

interface Props {
  value: string
  placeholder?: string
  bias?: { lat: number; lng: number } | null // localize suggestions (e.g. to the entered ZIP)
  onChange: (text: string) => void           // free typing (clears any prior coords)
  onSelect: (place: PlaceSelection) => void   // picked a suggestion (captures coords)
}

// Fallback bias when no ZIP is entered yet: geographic center of the contiguous US.
const US_CENTER = { lat: 39.83, lng: -98.58 }

function labelFor(p: Record<string, unknown>): string {
  const parts = [p.name, p.city ?? p.county, p.state]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
  // de-dupe (name sometimes equals city)
  return Array.from(new Set(parts)).join(', ')
}

export default function LocationAutocomplete({ value, placeholder, bias, onChange, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function query(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      try {
        const center = bias ?? US_CENTER
        const url =
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
          `&limit=5&lang=en&lat=${center.lat}&lon=${center.lng}`
        const res = await fetch(url, { signal: ctrl.signal })
        const data = await res.json()
        const out: Suggestion[] = (data.features ?? [])
          .filter((f: { properties?: { countrycode?: string } }) => f.properties?.countrycode === 'US')
          .map((f: { properties: Record<string, unknown>; geometry: { coordinates: [number, number] } }) => ({
            label: labelFor(f.properties),
            lng:   f.geometry.coordinates[0],
            lat:   f.geometry.coordinates[1],
          }))
          .filter((s: Suggestion) => s.label.length > 0)
        setSuggestions(out)
        setOpen(out.length > 0)
      } catch {
        /* aborted or network error — ignore */
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        autoComplete="off"
        aria-label={placeholder || 'Location'}
        value={value}
        placeholder={placeholder}
        maxLength={120}
        onChange={e => {
          onChange(e.target.value)
          query(e.target.value)
        }}
        onFocus={() => { if (suggestions.length) setOpen(true) }}
      />
      {open && (
        <ul
          style={{
            position: 'absolute', zIndex: 1000, top: '100%', left: 0, right: 0,
            margin: '4px 0 0', padding: 4, listStyle: 'none',
            background: '#111', border: '1px solid #2a2a2a', borderRadius: 4,
            maxHeight: 220, overflowY: 'auto',
            fontFamily: 'var(--mono)', fontSize: 12,
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat},${s.lng},${i}`}
              onClick={() => {
                onSelect(s)
                onChange(s.label)
                setOpen(false)
              }}
              style={{ padding: '8px 10px', color: '#ddd', cursor: 'pointer', borderRadius: 3 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d1d1d')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              📍 {s.label}
            </li>
          ))}
        </ul>
      )}
      {loading && (
        <span style={{ position: 'absolute', right: 10, top: 10, fontSize: 11, color: '#666' }}>…</span>
      )}
    </div>
  )
}
