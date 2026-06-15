'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProCta from './ProCta'

/** Hamburger dropdown for the header nav on mobile, where the inline nav links
 *  are hidden. Shown only at <=767px via CSS (.menu-wrap). */
export default function MobileMenu({ recallActive }: { recallActive: boolean }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="menu-wrap">
      <button
        className="menu-toggle"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <>
          <div className="menu-backdrop" onClick={close} aria-hidden="true" />
          <nav className="mobile-menu" aria-label="Main menu">
            <Link href="/diseases" onClick={close}>Diseases</Link>
            <Link href="/recalls" onClick={close}>
              Recalls{recallActive && <span className="recall-dot-inline" aria-hidden="true" />}
            </Link>
            <Link href="/alerts" onClick={close}>Alerts</Link>
            <Link href="/account" onClick={close}>Account</Link>
            <ProCta location="mobile_menu" className="mobile-menu-pro" onClick={close} />
          </nav>
        </>
      )}
    </div>
  )
}
