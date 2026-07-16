'use client'
import { useState } from 'react'

type Msg = { text: string; tone: 'success' | 'error' }

// Messages are keyed by the query param that triggered the banner, then status.
const MESSAGES: Record<string, Record<string, Msg>> = {
  verified: {
    success: { text: '✓ Report verified — your pin is now live on the map.', tone: 'success' },
    expired: { text: 'This verification link has expired or was already used.', tone: 'error' },
    missing: { text: 'No verification token was provided.', tone: 'error' },
    error:   { text: 'Something went wrong verifying your report. Please try again.', tone: 'error' },
  },
  removed: {
    success: { text: '✓ Your lost-dog post was removed. So glad they’re home!', tone: 'success' },
    invalid: { text: 'That removal link is invalid or has already been used.', tone: 'error' },
    error:   { text: 'Something went wrong removing your post. Please try again.', tone: 'error' },
  },
}

/** Top-of-page banner shown after a redirect like ?verified=<status> or ?removed=<status>. */
export default function VerifiedBanner({ status, param = 'verified' }: { status: string; param?: string }) {
  const [visible, setVisible] = useState(true)
  const msg = MESSAGES[param]?.[status]
  if (!msg || !visible) return null

  const success = msg.tone === 'success'

  function dismiss() {
    setVisible(false)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete(param)
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
        color:          success ? '#46f0a2' : '#ef4444',
        background:     success
          ? 'linear-gradient(180deg, rgba(70,240,162,0.10), rgba(70,240,162,0.05)), rgba(8,13,19,0.55)'
          : 'linear-gradient(180deg, rgba(239,68,68,0.10), rgba(239,68,68,0.05)), rgba(8,13,19,0.55)',
        borderBottom:   `1px solid ${success ? 'rgba(70,240,162,0.3)' : 'rgba(239,68,68,0.3)'}`,
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
