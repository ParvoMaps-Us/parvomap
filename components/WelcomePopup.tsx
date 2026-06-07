'use client'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'parvomap:welcome-seen'

export default function WelcomePopup() {
  const [open, setOpen] = useState(false)

  // Show once per browser. Gate on localStorage so returning visitors aren't nagged.
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {
      // localStorage blocked (private mode / SSR mismatch) — just show it.
      setOpen(true)
    }
  }, [])

  function close() {
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
      if (e.key === 'Escape') close()
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
      onClick={close}
    >
      <div className="welcome-card" onClick={e => e.stopPropagation()}>
        <button className="welcome-close" aria-label="Close" onClick={close}>
          ✕
        </button>

        <div className="welcome-eyebrow">Welcome to</div>
        <h2 id="welcome-title" className="welcome-title">
          ParvoMaps<span className="welcome-cursor">▌</span>
        </h2>

        <p className="welcome-lede">
          A community-powered early-warning map for <strong>parvo and other contagious
          dog diseases</strong> — so you know what&apos;s spreading near you before your dog
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
          <button className="welcome-btn-primary" onClick={close}>
            → Explore the map
          </button>
          <a
            className="welcome-btn-ghost"
            href="#report"
            onClick={close}
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
