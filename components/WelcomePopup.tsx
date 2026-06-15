'use client'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'parvomap:welcome-seen'

// Fire a GA4 event if gtag is loaded. No-op when analytics is blocked/absent so
// the popup never depends on it.
function track(action: string) {
  try {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
    gtag?.('event', action, { event_category: 'welcome_popup' })
  } catch {
    /* ignore */
  }
}

export default function WelcomePopup() {
  const [open, setOpen] = useState(false)

  // Show once per browser. Gate on localStorage so returning visitors aren't nagged.
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true)
        track('welcome_popup_view')
      }
    } catch {
      // localStorage blocked (private mode / SSR mismatch) — just show it.
      setOpen(true)
      track('welcome_popup_view')
    }
  }, [])

  // `reason` records how the popup was dismissed so we can compare CTA clicks
  // against plain dismissals in GA4.
  function close(reason: string) {
    track(`welcome_popup_${reason}`)
    setOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close('dismiss_escape')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return (
    <div
      className="welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={() => close('dismiss_backdrop')}
    >
      <div className="welcome-card" onClick={e => e.stopPropagation()}>
        <button className="welcome-close" aria-label="Close" onClick={() => close('dismiss_x')}>
          ✕
        </button>

        <div className="welcome-eyebrow">Welcome to</div>
        <h2 id="welcome-title" className="welcome-title">
          ParvoMaps<span className="welcome-cursor">▌</span>
        </h2>

        <p className="welcome-lede">
          A community-powered early-warning map for <strong>parvo and other contagious
          dog diseases</strong>, so you know what&apos;s spreading near you before your dog
          is at risk.
        </p>

        <ul className="welcome-points">
          <li>
            <span className="welcome-bullet">🗺️</span>
            See verified disease reports plotted near you.
          </li>
          <li>
            <span className="welcome-bullet">📍</span>
            Spotted a sick dog? File an anonymous report in seconds.
          </li>
          <li>
            <span className="welcome-bullet">🔔</span>
            Verify by email to publish your report and get nearby alerts.
          </li>
        </ul>

        <div className="welcome-actions">
          <button className="welcome-btn-primary" onClick={() => close('explore_click')}>
            → Explore the map
          </button>
          <a
            className="welcome-btn-ghost"
            href="#report"
            onClick={() => close('report_click')}
          >
            Report a case
          </a>
        </div>

        <div className="welcome-foot">
          Anonymous · no street address · we never sell your data
        </div>
      </div>
    </div>
  )
}
