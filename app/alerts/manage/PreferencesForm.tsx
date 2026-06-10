'use client'

import { useState } from 'react'

interface DiseaseOption { key: string; name: string }

interface Props {
  email: string
  exp: number
  token: string
  diseaseOptions: DiseaseOption[]
  initial: {
    zip: string
    radiusMiles: number
    diseases: 'all' | string[]
    lostDogs: boolean
    foodBrands?: string[]
  } | null
}

// Shared chip styling. Selected chips fill green; unselected are outlined.
function chipStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 999,
    border: `1px solid ${active ? 'var(--green)' : 'var(--border)'}`,
    background: active ? 'var(--green)' : 'transparent',
    color: active ? '#04130b' : 'var(--text-muted)',
    fontFamily: 'var(--mono)',
    fontSize: 12.5,
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    transition: 'all 0.12s',
    width: 'auto',
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
  }
}

export default function PreferencesForm({ email, exp, token, diseaseOptions, initial }: Props) {
  const [zip, setZip] = useState(initial?.zip ?? '')
  const [radius, setRadius] = useState(initial?.radiusMiles ?? 25)
  const [allDiseases, setAllDiseases] = useState(initial ? initial.diseases === 'all' : true)
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initial && initial.diseases !== 'all' ? initial.diseases : []),
  )
  const [lostDogs, setLostDogs] = useState(initial?.lostDogs ?? true)
  // Dog-food brands for recall alerts, as one comma-separated text field.
  const [foodBrands, setFoodBrands] = useState((initial?.foodBrands ?? []).join(', '))
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  function selectAll() {
    setAllDiseases(true)
    setSelected(new Set())
  }

  function toggleDisease(key: string) {
    setAllDiseases(false)
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus('saving')
    const diseases = allDiseases ? 'all' : [...selected]
    const brands = foodBrands.split(',').map(b => b.trim()).filter(Boolean)
    try {
      const res = await fetch('/api/alerts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, exp, token, zip, radiusMiles: radius, diseases, lostDogs, foodBrands: brands }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not save.')
        setStatus('idle')
        return
      }
      setStatus('saved')
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  const label = { display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
  const selectedCount = allDiseases ? diseaseOptions.length : selected.size

  return (
    <form onSubmit={save}>
      {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 14 }}>{error}</p>}
      {status === 'saved' && (
        <div style={{ border: '1px solid var(--green)', background: 'var(--green-dim)', borderRadius: 6, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: 'var(--green)' }}>
          ✓ Saved. You’ll get alerts for this area from now on. Re-open this page anytime to edit.
        </div>
      )}

      <div style={{ marginBottom: 22 }}>
        <span style={label}>Your ZIP code</span>
        <input value={zip} onChange={e => setZip(e.target.value)} inputMode="numeric" maxLength={5} placeholder="84101" required style={{ width: 140, fontFamily: 'var(--mono)' }} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <span style={label}>Alert radius — <strong style={{ color: 'var(--text)' }}>{radius} miles</strong></span>
        <input type="range" min={1} max={100} value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--green)', height: 6 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
          <span>1 mi</span><span>100 mi</span>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <span style={label}>Diseases to watch · <span style={{ color: 'var(--green)' }}>{selectedCount} selected</span></span>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '0 0 10px' }}>Tap to add or remove. Pick “All” or choose specific ones.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" onClick={selectAll} style={chipStyle(allDiseases)}>
            {allDiseases ? '✓ ' : ''}All diseases &amp; hazards
          </button>
          {diseaseOptions.map(d => {
            const on = !allDiseases && selected.has(d.key)
            return (
              <button key={d.key} type="button" onClick={() => toggleDisease(d.key)} style={chipStyle(on)}>
                {on ? '✓ ' : ''}{d.name}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: 26 }}>
        <span style={label}>Lost dogs</span>
        <button type="button" onClick={() => setLostDogs(v => !v)} style={chipStyle(lostDogs)}>
          {lostDogs ? '✓ ' : ''}🐶 Alert me about lost dogs nearby
        </button>
      </div>

      <div style={{ marginBottom: 26 }}>
        <span style={label}>🛑 Dog food recall alerts</span>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '0 0 10px' }}>
          What food does your dog eat? We&apos;ll email you the moment the FDA recalls one of your brands.
          Separate multiple brands with commas.
        </p>
        <input
          value={foodBrands}
          onChange={e => setFoodBrands(e.target.value)}
          placeholder="e.g. Purina Pro Plan, Blue Buffalo, Sportmix"
          style={{ width: '100%', fontFamily: 'var(--mono)' }}
        />
      </div>

      <button type="submit" disabled={status === 'saving'} style={{ width: '100%', padding: '13px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, background: 'var(--green)', color: '#04130b' }}>
        {status === 'saving' ? 'Saving…' : 'Save alert preferences'}
      </button>
    </form>
  )
}
