'use client'
import { useState } from 'react'

const MESSAGES: Record<string, { text: string; tone: 'success' | 'error' }> = {
  success: { text: '✓ Report verified — your pin is now live on the map.', tone: 'success' },
  expired: { text: 'This verification link has expired or was already used.', tone: 'error' },
  missing: { text: 'No verification token was provided.', tone: 'error' },
  error:   { text: 'Something went wrong verifying your report. Please try again.', tone: 'error' },
}

/** Top-of-page banner shown after the /api/verify redirect (?verified=<status>). */
export default function VerifiedBanner({ status }: { status: string }) {
  const [visible, setVisible] = useState(true)
  const msg = MESSAGES[status]
  if (!msg || !visible) return null

  const success = msg.tone === 'success'

  function dismiss() {
    setVisible(false)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('verified')
      window.history.replaceState({}, '', url.toString())
    }
  }

  return (
    <div
      role="status"
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            12,
        padding:        '12px 16px',
        fontFamily:     'var(--mono)',
        fontSize:       13,
        letterSpacing:  '0.04em',
        color:          success ? '#00ff88' : '#ef4444',
        background:     success ? 'rgba(0,255,136,0.08)' : 'rgba(239,68,68,0.08)',
        borderBottom:   `1px solid ${success ? 'rgba(0,255,136,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}
    >
      <span>{msg.text}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background:  'none',
          border:      'none',
          color:       'inherit',
          cursor:      'pointer',
          fontSize:    18,
          lineHeight:  1,
          padding:     0,
        }}
      >
        ×
      </button>
    </div>
  )
}
