'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { STATES } from '@/lib/states'

/** Desktop header item: "Outbreaks ▾" opens a state picker so any state page
 *  is one click from the map. Hidden on mobile alongside the other .nav-link
 *  items; MobileMenu carries the equivalent link there. */
export default function OutbreaksNav() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} className="nav-link-wrap" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="nav-link"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        Outbreaks
        <span aria-hidden="true" style={{ fontSize: 8, display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Outbreaks by state"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 1200,
            width: 480, maxWidth: 'calc(100vw - 24px)', maxHeight: '60vh', overflowY: 'auto',
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
            padding: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          }}
        >
          <Link
            href="/outbreaks"
            onClick={() => setOpen(false)}
            style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--green)', textDecoration: 'none', padding: '4px 6px 10px', borderBottom: '1px solid var(--border)', marginBottom: 10 }}
          >
            All US outbreaks →
          </Link>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 2 }}>
            {STATES.map(s => (
              <Link
                key={s.abbr}
                href={`/outbreaks/${s.slug}`}
                onClick={() => setOpen(false)}
                role="menuitem"
                style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', padding: '5px 6px', borderRadius: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
