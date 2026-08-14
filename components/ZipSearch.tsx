'use client'
import { useEffect, useRef, useState } from 'react'
import type { Report } from '@/lib/redis'
import { getDiseaseName } from '@/lib/diseases'
import { milesBetween } from '@/lib/coords'

const RADIUS_MILES = 50

interface Props {
  reports?: Report[]
}

interface Hit {
  report: Report
  miles: number
}

/**
 * "Any cases near me?" — the one question a dog owner actually arrives with.
 *
 * Deliberately does NOT navigate anywhere. It flies the existing map to the ZIP
 * and answers in place, because the map IS the product and a results page would
 * mean maintaining a second view of the same data.
 *
 * Also the landing point for ?focus=lat,lng links (the dashboard's "Locate"
 * action), so admin and public share one focus path instead of two.
 */
export default function ZipSearch({ reports = [] }: Props) {
  const [zip, setZip] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ label: string; hits: Hit[] } | null>(null)
  const reportsRef = useRef(reports)
  reportsRef.current = reports

  const focusMap = (lat: number, lng: number, label: string, zoom = 9) => {
    window.dispatchEvent(new CustomEvent('parvomap:focus', { detail: { lat, lng, label, zoom } }))
    document.querySelector('.map-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const nearby = (lat: number, lng: number): Hit[] =>
    reportsRef.current
      .filter(r => typeof r.lat === 'number' && typeof r.lng === 'number')
      .map(r => ({ report: r, miles: milesBetween(lat, lng, r.lat as number, r.lng as number) }))
      .filter(h => h.miles <= RADIUS_MILES)
      .sort((a, b) => a.miles - b.miles)

  // Deep links: /?focus=40.5,-111.9 — used by the dashboard to jump straight to
  // one reported case. Runs once on mount, then strips the param so a refresh
  // or a shared URL doesn't re-fly the map unexpectedly.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const focus = params.get('focus')
    if (!focus) return
    const [lat, lng] = focus.split(',').map(Number)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return

    const label = params.get('label') || 'Reported case'
    const t = setTimeout(() => focusMap(lat, lng, label, 12), 700) // let Leaflet mount first
    params.delete('focus')
    params.delete('label')
    const qs = params.toString()
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
    return () => clearTimeout(t)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = zip.trim()
    if (!/^\d{5}$/.test(clean)) {
      setError('Enter a 5-digit ZIP code.')
      setResult(null)
      return
    }

    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/geocode?zip=${clean}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not look that ZIP up.')
        setResult(null)
        return
      }
      const label = [data.city, data.state].filter(Boolean).join(', ') || clean
      setResult({ label, hits: nearby(data.lat, data.lng) })
      focusMap(data.lat, data.lng, `${clean} · ${label}`)
    } catch {
      setError('Lookup failed. Check your connection and try again.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = {
    flex: '1 1 140px', minWidth: 0, padding: '10px 12px', borderRadius: 6,
    border: '1px solid var(--border)', background: 'var(--bg-surface)',
    color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 14, letterSpacing: '0.08em',
  } as const

  return (
    <section aria-label="Check for cases near your ZIP code" style={{ maxWidth: 900, margin: '18px auto 0', padding: '0 24px' }}>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label htmlFor="zip-search" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', flex: 'none' }}>
          Cases near you
        </label>
        <input
          id="zip-search"
          name="zip"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder="ZIP code"
          value={zip}
          onChange={e => setZip(e.target.value.replace(/\D/g, ''))}
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={busy}
          style={{
            flex: 'none', padding: '10px 20px', borderRadius: 6, border: 'none',
            cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--mono)', fontSize: 13,
            fontWeight: 700, background: 'var(--green)', color: '#04130b', opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Checking…' : 'Check'}
        </button>
      </form>

      <div aria-live="polite" style={{ fontFamily: 'var(--mono)', fontSize: 13, marginTop: 10, lineHeight: 1.7 }}>
        {error && <span style={{ color: 'var(--red, #ef4444)' }}>{error}</span>}

        {result && result.hits.length === 0 && (
          <span style={{ color: 'var(--green)' }}>
            ✓ No reported cases within {RADIUS_MILES} miles of {result.label}. Keep vaccinations current anyway.
          </span>
        )}

        {result && result.hits.length > 0 && (
          <>
            <div style={{ color: 'var(--text)' }}>
              <strong>{result.hits.length}</strong> reported case{result.hits.length !== 1 ? 's' : ''} within {RADIUS_MILES} miles of {result.label}.
              {' '}Nearest is <strong>{getDiseaseName(result.hits[0].report.disease)}</strong>{' '}
              {result.hits[0].miles < 1 ? 'right here' : `about ${Math.round(result.hits[0].miles)} miles away`}.
            </div>
            <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {result.hits.slice(0, 6).map(h => (
                <li key={h.report.id}>
                  <button
                    type="button"
                    onClick={() => focusMap(h.report.lat as number, h.report.lng as number, getDiseaseName(h.report.disease), 12)}
                    style={{
                      fontFamily: 'var(--mono)', fontSize: 12, padding: '6px 12px', borderRadius: 6,
                      border: '1px solid var(--border)', background: 'var(--bg-card)',
                      color: 'var(--text-muted)', cursor: 'pointer',
                    }}
                  >
                    {getDiseaseName(h.report.disease)} · {[h.report.city, h.report.state].filter(Boolean).join(', ')} · {Math.round(h.miles)} mi
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
