'use client'

import { useState } from 'react'

export default function RequestDiseaseForm({
  email,
  exp,
  token,
}: {
  email: string
  exp: number
  token: string
}) {
  const [disease, setDisease] = useState('')
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/clinic/request-disease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, exp, token, disease, note }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong.')
        setState('idle')
        return
      }
      setState('sent')
    } catch {
      setError('Network error. Please try again.')
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <div style={{ border: '1px solid var(--green)', background: 'var(--green-dim)', borderRadius: 6, padding: '14px 16px', fontSize: 13, color: 'var(--green)', lineHeight: 1.6 }}>
        ✓ Request received. We’ll start tracking <strong>{disease}</strong> within 24–72 hours and email you when it’s live.
      </div>
    )
  }

  const field = { width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, boxSizing: 'border-box' as const }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>}
      <div>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 5 }}>Disease or condition</label>
        <input
          type="text"
          required
          value={disease}
          onChange={e => setDisease(e.target.value)}
          placeholder="e.g. Canine respiratory disease complex (atypical)"
          style={field}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 5 }}>Why / context (optional)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Region, strain, what you need it for…"
          style={{ ...field, resize: 'vertical' }}
        />
      </div>
      <button
        type="submit"
        disabled={state === 'sending'}
        style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, background: 'var(--green)', color: '#04130b' }}
      >
        {state === 'sending' ? 'Sending…' : 'Request tracking'}
      </button>
    </form>
  )
}
