'use client'

import { useState } from 'react'

/** Multi-select disease chips. The whole pill toggles on click and highlights
 *  when selected; hidden inputs named "disease" carry the selection into the
 *  surrounding GET form so every chosen disease submits. */
export default function DiseaseChips({
  options,
  initialSelected,
}: {
  options: { key: string; name: string }[]
  initialSelected: string[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))

  function toggle(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {[...selected].map(key => (
        <input key={`h-${key}`} type="hidden" name="disease" value={key} />
      ))}
      {options.map(({ key, name }) => {
        const on = selected.has(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            aria-pressed={on}
            style={{
              cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12,
              padding: '6px 14px', borderRadius: 999, flex: '0 0 auto',
              fontFamily: 'var(--mono)', fontWeight: on ? 700 : 400,
              border: `1px solid ${on ? 'var(--green)' : 'var(--border)'}`,
              background: on ? 'var(--green-dim)' : 'var(--bg-surface)',
              color: on ? 'var(--green)' : 'var(--text-muted)',
            }}
          >
            {name}
          </button>
        )
      })}
    </div>
  )
}
