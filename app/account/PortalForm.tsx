'use client'

import { useState } from 'react'

export default function PortalForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function open(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not send the billing link.')
        setLoading(false)
        return
      }
      // The link is emailed (never returned) so nobody can open someone else's
      // billing portal by typing their address. Show a neutral confirmation.
      setSent(true)
      setLoading(false)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <p style={{ color: 'var(--green)', fontSize: 14, lineHeight: 1.6 }}>
        If that email has a subscription, a link to manage your billing is on its way.
        Check your inbox (and spam folder).
      </p>
    )
  }

  return (
    <form onSubmit={open}>
      {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
        Email you subscribed with
      </label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="email"
          required
          aria-label="Email address"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ flex: 1, minWidth: 220, padding: '11px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 14 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '11px 22px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, background: 'var(--green)', color: '#04130b' }}
        >
          {loading ? 'Sending…' : 'Email billing link'}
        </button>
      </div>
    </form>
  )
}
