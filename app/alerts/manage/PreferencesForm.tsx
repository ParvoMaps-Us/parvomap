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
  } | null
}

export default function PreferencesForm({ email, exp, token, diseaseOptions, initial }: Props) {
  const [zip, setZip] = useState(initial?.zip ?? '')
  const [radius, setRadius] = useState(initial?.radiusMiles ?? 25)
  const [allDiseases, setAllDiseases] = useState(initial ? initial.diseases === 'all' : true)
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initial && initial.diseases !== 'all' ? initial.diseases : []),
  )
  const [lostDogs, setLostDogs] = useState(initial?.lostDogs ?? true)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  function toggleDisease(key: string) {
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
    try {
      const res = await fetch('/api/alerts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, exp, token, zip, radiusMiles: radius, diseases, lostDogs }),
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

  const label = { display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 } as const
  const input = { padding: '11px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 14 } as const

  return (
    <form onSubmit={save}>
      {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 14 }}>{error}</p>}
      {status === 'saved' && (
        <div style={{ border: '1px solid var(--green)', background: 'var(--green-dim)', borderRadius: 6, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--green)' }}>
          ✓ Saved. You’ll get alerts for this area from now on.
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={label}>Your ZIP code</label>
        <input value={zip} onChange={e => setZip(e.target.value)} inputMode="numeric" maxLength={5} placeholder="84101" required style={{ ...input, width: 140 }} />
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={label}>Alert radius: <strong style={{ color: 'var(--text)' }}>{radius} miles</strong></label>
        <input type="range" min={1} max={100} value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--green)' }} />
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={label}>Diseases to watch</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={allDiseases} onChange={e => setAllDiseases(e.target.checked)} style={{ accentColor: 'var(--green)' }} />
          All diseases &amp; hazards
        </label>
        {!allDiseases && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6, paddingLeft: 4 }}>
            {diseaseOptions.map(d => (
              <label key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(d.key)} onChange={() => toggleDisease(d.key)} style={{ accentColor: 'var(--green)' }} />
                {d.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 26 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={lostDogs} onChange={e => setLostDogs(e.target.checked)} style={{ accentColor: 'var(--green)' }} />
          🐶 Also alert me about lost dogs nearby
        </label>
      </div>

      <button type="submit" disabled={status === 'saving'} style={{ width: '100%', padding: '12px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, background: 'var(--green)', color: '#04130b' }}>
        {status === 'saving' ? 'Saving…' : 'Save alert preferences'}
      </button>
    </form>
  )
}
