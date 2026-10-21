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

const SHARE_TEXT =
  'If your dog ever had parvo or another contagious disease, add it to this map (anonymous, 30 seconds) so owners nearby get warned:'

export default function WelcomePopup() {
  const [open, setOpen] = useState(false)
  const [shareLabel, setShareLabel] = useState('Send to a friend')

  // Most dog-disease cases never reach the news, so the map fills in only when owners
  // add their own case or pass it to someone who had one. Share sheet on phones,
  // copy-to-clipboard elsewhere. The popup stays open so they can still add their own.
  async function share() {
    track('welcome_popup_share_click')
    const url = window.location.origin + '/'
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ParvoMaps', text: SHARE_TEXT, url })
        return
      }
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`)
      setShareLabel('✓ Link copied')
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') setShareLabel('Copy failed, try again')
    }
  }

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

        <div className="welcome-eyebrow">Welcome to ParvoMaps</div>
        <h2 id="welcome-title" className="welcome-title">
          Has your dog had parvo?
        </h2>

        <p className="welcome-lede">
          Most cases <strong>never make the news</strong>. Every case you add warns the dog
          owners near you before their dog catches it.
        </p>

        <ul className="welcome-points">
          <li>
            <span className="welcome-bullet">🐶</span>
            Your dog had parvo, distemper, lepto or kennel cough? Add it in 30 seconds.
          </li>
          <li>
            <span className="welcome-bullet">💬</span>
            Know someone whose dog had it? Send them this map.
          </li>
          <li>
            <span className="welcome-bullet">🗺️</span>
            See what&apos;s spreading near you, verified and sourced.
          </li>
        </ul>

        <div className="welcome-actions">
          <a className="welcome-btn-primary" href="#report" onClick={() => close('report_click')}>
            → Add my dog&apos;s case
          </a>
          <button className="welcome-btn-ghost" onClick={share}>
            {shareLabel}
          </button>
        </div>

        <button
          onClick={() => close('explore_click')}
          style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'var(--text-dim, #888)', fontFamily: 'inherit', fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
        >
          Just explore the map
        </button>

        <div className="welcome-foot">
          Anonymous · no name, no street address · we never sell your data
        </div>
      </div>
    </div>
  )
}
