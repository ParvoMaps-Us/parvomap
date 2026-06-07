'use client'

import { useState } from 'react'

export default function RequestLinkForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/clinic/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
      <div style={{ border: '1px solid var(--green)', background: 'var(--green-dim)', borderRadius: 6, padding: '16px 18px', fontSize: 13, color: 'var(--green)', lineHeight: 1.6 }}>
        ✓ If that email has an active Pro Clinic subscription, we just sent a link to your dashboard. Check your inbox.
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
        Clinic subscriber email
      </label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="clinic@example.com"
          style={{ flex: 1, minWidth: 220, padding: '11px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 14 }}
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          style={{ padding: '11px 22px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, background: 'var(--green)', color: '#04130b' }}
        >
          {state === 'sending' ? 'Sending…' : 'Email me a link'}
        </button>
      </div>
    </form>
  )
}
