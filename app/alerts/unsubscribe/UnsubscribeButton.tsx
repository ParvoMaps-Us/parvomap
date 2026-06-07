'use client'

import { useState } from 'react'

export default function UnsubscribeButton({ email, token }: { email: string; token: string }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function unsubscribe() {
    setError(null)
    setStatus('working')
    try {
      const res = await fetch('/api/alerts/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not unsubscribe.')
        setStatus('idle')
        return
      }
      setStatus('done')
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <div style={{ border: '1px solid var(--green)', background: 'var(--green-dim)', borderRadius: 6, padding: '14px 16px', fontSize: 13, color: 'var(--green)', lineHeight: 1.6 }}>
        ✓ Done — you’ve been unsubscribed from ParvoMaps alerts. Your subscription billing is unaffected;
        manage that at <a href="/account" style={{ color: 'var(--green)' }}>parvomaps.us/account</a>.
      </div>
    )
  }

  return (
    <div>
      {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button
        onClick={unsubscribe}
        disabled={status === 'working'}
        style={{ padding: '11px 22px', borderRadius: 6, border: '1px solid var(--red)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, background: 'transparent', color: 'var(--red)' }}
      >
        {status === 'working' ? 'Unsubscribing…' : 'Yes, stop sending me alerts'}
      </button>
    </div>
  )
}
