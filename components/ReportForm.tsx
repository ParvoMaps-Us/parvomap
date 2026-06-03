'use client'
import { useState } from 'react'

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

export default function ReportForm() {
  const [disease, setDisease] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      disease,
      zip:    (form.elements.namedItem('zip')    as HTMLInputElement).value.trim(),
      email:  (form.elements.namedItem('email')  as HTMLInputElement).value.trim(),
      source: (form.elements.namedItem('source') as HTMLSelectElement).value || undefined,
      breed:  (form.elements.namedItem('breed')  as HTMLInputElement).value.trim() || undefined,
      notes:  notes.trim() || undefined,
    }

    try {
      const res = await fetch('/api/report', {
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
          <button className="btn-another" onClick={() => setSubmitted(false)}>
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

          <div className="form-group">
            <label>ZIP Code <span className="req">*</span></label>
            <input type="text" name="zip" placeholder="e.g. 84101" maxLength={5} pattern="\d{5}" required />
          </div>

          <div className="form-group">
            <label>Source <span className="opt">(optional)</span></label>
            <select name="source">
              <option value="">Select source (optional)</option>
              <option value="vet-diagnosed">Veterinarian diagnosed</option>
              <option value="positive-test">Positive test result</option>
              <option value="owner-observed">Strong symptoms — owner observed</option>
              <option value="neighbor-report">Reported by neighbor</option>
              <option value="social-media">Seen on social media / community</option>
              <option value="other">Other</option>
            </select>
          </div>

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
            <button type="submit" className="btn-submit" disabled={!disease || loading}>
              {loading ? <span className="spinner" /> : '→ Submit Report'}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
