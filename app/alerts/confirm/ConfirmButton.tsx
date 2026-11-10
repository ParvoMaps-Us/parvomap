'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function ConfirmButton({ token, zip }: { token: string; zip: string }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const doneRef = useRef<HTMLDivElement>(null)

  // The button is replaced by the result; move focus there.
  useEffect(() => {
    if (status === 'done') doneRef.current?.focus()
  }, [status])

  async function confirm() {
    setError(null)
    setStatus('working')
    try {
      const res = await fetch('/api/alerts/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not turn alerts on.')
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
      <div role="status" tabIndex={-1} ref={doneRef} style={{ border: '1px solid var(--green)', background: 'var(--green-glow)', borderRadius: 8, padding: '16px 18px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--green)' }}>Your alerts are on for ZIP {zip}.</strong> We only email when there
        is news. No news near you means no email. Every email has a link to stop.
        <div style={{ marginTop: 10 }}>
          <Link href="/" style={{ color: 'var(--green)' }}>← Back to the map</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && <p role="alert" style={{ color: '#fca5a5', fontSize: 14, marginBottom: 12 }}>{error}</p>}
      <button
        type="button"
        onClick={confirm}
        disabled={status === 'working'}
        style={{
          minHeight: 44, padding: '12px 24px', borderRadius: 6, border: 'none',
          cursor: status === 'working' ? 'wait' : 'pointer', fontFamily: 'var(--mono)', fontSize: 14,
          fontWeight: 700, background: 'var(--green)', color: '#04130b', opacity: status === 'working' ? 0.6 : 1,
        }}
      >
        {status === 'working' ? 'Turning on…' : 'Turn on my alerts'}
      </button>
    </div>
  )
}
