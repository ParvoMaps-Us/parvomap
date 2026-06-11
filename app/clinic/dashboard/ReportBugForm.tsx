'use client'

import { useState } from 'react'

export default function ReportBugForm() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/clinic/report-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ message }),
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

  const btn = { padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, background: 'var(--bg-surface)', color: 'var(--text-muted)' }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={btn}>
        🐞 Report a bug
      </button>
    )
  }

  if (state === 'sent') {
    return (
      <div style={{ border: '1px solid var(--green)', background: 'var(--green-dim)', borderRadius: 6, padding: '12px 14px', fontSize: 13, color: 'var(--green)', lineHeight: 1.6 }}>
        ✓ Thanks — your report was sent. We’ll take a look.
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 520 }}>
      {error && <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>}
      <label style={{ fontSize: 11, color: 'var(--text-dim)' }}>Describe the bug — what happened, what you expected</label>
      <textarea
        required
        aria-label="Bug description"
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={4}
        placeholder="e.g. The county filter showed no results even though…"
        style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={state === 'sending'} style={{ padding: '9px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, background: 'var(--green)', color: '#04130b' }}>
          {state === 'sending' ? 'Sending…' : 'Send report'}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, background: 'transparent', color: 'var(--text-dim)' }}>
          Cancel
        </button>
      </div>
    </form>
  )
}
