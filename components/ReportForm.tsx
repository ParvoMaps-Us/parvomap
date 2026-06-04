'use client'
import { useEffect, useState } from 'react'
import { LOCATION_DETAIL_DISEASES } from '@/lib/report-schema'
import LocationAutocomplete from './LocationAutocomplete'

const DISEASES = [
  { key: 'parvo', label: 'Parvovirus', color: 'var(--d-parvo)' },
  { key: 'distemper', label: 'Distemper', color: 'var(--d-distemper)' },
  { key: 'kennel', label: 'Kennel Cough', color: 'var(--d-kennel)' },
  { key: 'leptospira', label: 'Leptospirosis', color: 'var(--d-leptospira)' },
  { key: 'influenza', label: 'Dog Flu', color: 'var(--d-influenza)' },
  { key: 'giardia', label: 'Giardia', color: 'var(--d-giardia)' },
  { key: 'ringworm', label: 'Ringworm', color: 'var(--d-ringworm)' },
  { key: 'brucella', label: 'Brucellosis', color: 'var(--d-brucella)' },
  { key: 'cyano', label: 'Blue-green Algae', color: 'var(--d-cyano)' },
  { key: 'lyme', label: 'Lyme Disease', color: 'var(--d-lyme)' },
  { key: 'rmsf', label: 'RMSF', color: 'var(--d-rmsf)' },
  { key: 'anaplasma', label: 'Anaplasmosis', color: 'var(--d-anaplasma)' },
  { key: 'ehrlichia', label: 'Ehrlichiosis', color: 'var(--d-ehrlichia)' },
  { key: 'tickspot', label: 'Tick Sighting', color: 'var(--d-tickspot)' },
]

type ReporterType = 'individual' | 'vet' | 'facility' | 'news'

export default function ReportForm() {
  const [disease, setDisease] = useState('')
  const [reporterType, setReporterType] = useState<ReporterType | ''>('')
  // For an individual: 'affected' (own dog) or 'sighting' (saw it elsewhere).
  const [individualKind, setIndividualKind] = useState<'affected' | 'sighting' | ''>('')
  const [zip, setZip] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [locationDetail, setLocationDetail] = useState('')
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  // Bias autocomplete to the entered ZIP so suggestions are local in any state.
  const [zipCenter, setZipCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Resolve the ZIP to a centroid (client-side) to localize place suggestions.
  useEffect(() => {
    if (!/^\d{5}$/.test(zip)) { setZipCenter(null); return }
    let cancelled = false
    fetch(`https://api.zippopotam.us/us/${zip}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data?.places?.[0]) return
        const p = data.places[0]
        setZipCenter({ lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [zip])

  // A map pin's "⚠ Report this area" button prefills the location and scrolls here.
  useEffect(() => {
    function onReportArea(e: Event) {
      const d = (e as CustomEvent).detail as {
        locationDetail?: string; lat?: number; lng?: number; zip?: string
      }
      if (d.zip) setZip(d.zip)
      if (d.locationDetail) setLocationDetail(d.locationDetail)
      if (d.lat != null && d.lng != null) setLocationCoords({ lat: d.lat, lng: d.lng })
      document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' })
    }
    window.addEventListener('parvomap:report-area', onReportArea)
    return () => window.removeEventListener('parvomap:report-area', onReportArea)
  }, [])

  // Any report can note a suspected location (e.g. the dog park where exposure
  // likely happened). Place-based hazards (algae, ticks) word it as a hazard spot.
  const isPlaceHazard = (LOCATION_DETAIL_DISEASES as readonly string[]).includes(disease)
  const isNews = reporterType === 'news'
  // Show once a disease is picked, when prefilled from a map pin, or for news
  // (where the article's area is the whole point).
  const showLocationDetail = disease !== '' || locationDetail !== '' || isNews

  // The location field's wording depends on context (news vs hazard vs dog illness).
  const locLabel = isNews
    ? 'City or area the article is about'
    : isPlaceHazard ? 'Specific location' : 'Where was your dog likely exposed?'
  const locHint = isNews
    ? '(the area the article covers — not your station)'
    : isPlaceHazard ? '(helps others avoid the exact spot)' : '(optional — e.g. a dog park)'
  const locPlaceholder = isNews
    ? 'Start typing the city or place from the article…'
    : isPlaceHazard
      ? 'Start typing a lake, canyon, or trail…'
      : 'Start typing a dog park, daycare, or place…'
  const isSighting = reporterType === 'individual' && individualKind === 'sighting'
  // Submit is blocked until the branching questions are answered.
  const reporterAnswered =
    reporterType !== '' &&
    (reporterType !== 'individual' || individualKind !== '') &&
    (reporterType !== 'news' || sourceUrl.trim() !== '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      disease,
      reporterType,
      sighting: isSighting,
      zip:    zip.trim(),
      email:  (form.elements.namedItem('email')  as HTMLInputElement).value.trim(),
      source: (form.elements.namedItem('source') as HTMLSelectElement)?.value || undefined,
      breed:  (form.elements.namedItem('breed')  as HTMLInputElement).value.trim() || undefined,
      notes:  notes.trim() || undefined,
      locationDetail: locationDetail.trim() || undefined,
      locationLat: locationCoords?.lat,
      locationLng: locationCoords?.lng,
      sourceUrl: sourceUrl.trim() || undefined,
    }

    // On the bare apex, post directly to the canonical www host. A relative
    // POST from the apex would 308-redirect cross-origin, which the browser
    // silently blocks (it won't follow a cross-origin redirect for a JSON
    // POST). A direct cross-origin request is preflighted and allowed instead.
    const endpoint =
      typeof window !== 'undefined' && window.location.hostname === 'parvomaps.us'
        ? 'https://www.parvomaps.us/api/report'
        : '/api/report'

    try {
      const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json?.error?.formErrors?.[0] ?? json?.error ?? 'Submission failed — please try again.')
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError('Network error — please check your connection and try again.')
    }

    setLoading(false)
  }

  if (submitted) {
    return (
      <section id="report" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="success-box">
          <div className="success-title">Report Received</div>
          <div className="success-body">
            Your report has been submitted. <strong>Check your email</strong> to verify and publish it to the map.
          </div>
          <button
            className="btn-another"
            onClick={() => {
              setSubmitted(false)
              setDisease('')
              setReporterType('')
              setIndividualKind('')
              setZip('')
              setSourceUrl('')
              setLocationDetail('')
              setLocationCoords(null)
              setNotes('')
            }}
          >
            + Submit another report
          </button>
        </div>
      </section>
    )
  }

  return (
    <section id="report">
      <div className="section-header" style={{ marginTop: 0 }}>
        <div className="section-num">02</div>
        <div className="section-title">Report a Case</div>
      </div>

      <p className="section-desc">
        Spotted a sick dog in your neighborhood? <strong>Your report protects others.</strong> Reports are anonymous
        and appear on the map after email verification. ZIP code is required — exact address is never collected.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Disease picker */}
          <div className="form-group full">
            <label>Disease / Hazard <span className="req">*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
              {DISEASES.map(d => (
                <button
                  key={d.key}
                  type="button"
                  className={`disease-opt ${disease === d.key ? 'active' : ''}`}
                  style={{ '--dc': d.color } as React.CSSProperties}
                  onClick={() => setDisease(d.key)}
                >
                  <span className="disease-swatch" />
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suspected location — a hazard spot, or where a dog was likely exposed */}
          {showLocationDetail && (
            <div className="form-group full">
              <label>
                {locLabel} <span className="opt">{locHint}</span>
              </label>
              <LocationAutocomplete
                value={locationDetail}
                bias={zipCenter}
                placeholder={locPlaceholder}
                onChange={text => {
                  setLocationDetail(text)
                  setLocationCoords(null) // typing invalidates any picked place
                }}
                onSelect={place => {
                  setLocationDetail(place.label)
                  setLocationCoords({ lat: place.lat, lng: place.lng })
                }}
              />
              {locationCoords && (
                <div style={{ marginTop: 4, fontSize: 10, color: '#00ff88', fontFamily: 'var(--mono)' }}>
                  ✓ Exact spot pinned
                </div>
              )}
            </div>
          )}

          {/* Reporter type — drives follow-up questions and lead routing */}
          <div className="form-group full">
            <label>Who&apos;s reporting? <span className="req">*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 6 }}>
              {([
                ['individual', '🐕 Individual / dog owner'],
                ['vet',        '🏥 Veterinarian / clinic'],
                ['facility',   '🏢 Boarding / commercial facility'],
                ['news',       '📰 News / media outlet'],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`disease-opt ${reporterType === val ? 'active' : ''}`}
                  onClick={() => {
                    setReporterType(val)
                    if (val !== 'individual') setIndividualKind('')
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Individual sub-question — affected owner vs. secondhand sighting */}
          {reporterType === 'individual' && (
            <div className="form-group full">
              <label>Is your own dog affected? <span className="req">*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 6 }}>
                {([
                  ['affected', '🐾 My dog is sick / was exposed'],
                  ['sighting', '👀 Just reporting a sighting'],
                ] as const).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    className={`disease-opt ${individualKind === val ? 'active' : ''}`}
                    onClick={() => setIndividualKind(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* News/media: paste the source article link */}
          {reporterType === 'news' && (
            <div className="form-group full">
              <label>
                Article link <span className="req">*</span>{' '}
                <span className="opt">(paste the news article URL)</span>
              </label>
              <input
                type="url"
                inputMode="url"
                placeholder="https://…"
                maxLength={500}
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>ZIP Code <span className="req">*</span></label>
            <input
              type="text"
              name="zip"
              placeholder="e.g. 84101"
              maxLength={5}
              pattern="\d{5}"
              required
              value={zip}
              onChange={e => setZip(e.target.value.replace(/\D/g, ''))}
            />
            {isNews && (
              <div style={{ marginTop: 4, fontSize: 10, color: '#888', fontFamily: 'var(--mono)' }}>
                ZIP of the area the article is about — not your station.
              </div>
            )}
          </div>

          {/* "How confirmed" only applies when it's an actual case, not a sighting */}
          {!isSighting && (
            <div className="form-group">
              <label>How was it confirmed? <span className="opt">(optional)</span></label>
              <select name="source">
                <option value="">Select…</option>
                <option value="vet-diagnosed">Veterinarian diagnosed</option>
                <option value="positive-test">Positive test result</option>
                <option value="owner-observed">Strong symptoms observed</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Your Email <span className="opt">(to verify & notify)</span></label>
            <input type="email" name="email" placeholder="your@email.com" />
          </div>

          <div className="form-group">
            <label>Dog&apos;s Breed <span className="opt">(optional)</span></label>
            <input type="text" name="breed" placeholder="e.g. Labrador, mixed breed..." />
          </div>

          <div className="form-group full">
            <label>
              Notes <span className="opt">(optional · max 280 chars)</span>
            </label>
            <textarea
              name="notes"
              placeholder="Additional details — symptoms, exposure location, timeline..."
              maxLength={280}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className={`char-counter ${notes.length > 250 ? 'near' : ''} ${notes.length === 280 ? 'at' : ''}`}>
              {notes.length}/280
            </div>
          </div>

          <div className="privacy-note">
            🔒 Reports are anonymous. Email is used only to verify your report and send nearby alerts.
            We never share or sell your information. ZIP code only — no street address collected.
          </div>

          {error && (
            <div className="form-group full" style={{
              color: 'var(--red)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '0.04em',
              padding: '8px 12px',
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.06)',
            }}>
              ⚠ {error}
            </div>
          )}

          <div className="form-group full">
            <button type="submit" className="btn-submit" disabled={!disease || !reporterAnswered || loading}>
              {loading ? <span className="spinner" /> : '→ Submit Report'}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
