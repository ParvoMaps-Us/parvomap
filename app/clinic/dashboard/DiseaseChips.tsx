'use client'

import { useState } from 'react'

/** Multi-select disease chips. Renders real checkboxes named "disease" inside
 *  the surrounding GET form (so submit picks up every checked one), but tracks
 *  state client-side so each pill turns green the moment it's toggled. */
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
      {options.map(({ key, name }) => {
        const on = selected.has(key)
        return (
          <label
            key={key}
            style={{
              cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', fontSize: 12,
              padding: '6px 12px', borderRadius: 999, flex: '0 0 auto',
              border: `1px solid ${on ? 'var(--green)' : 'var(--border)'}`,
              background: on ? 'var(--green-dim)' : 'var(--bg-surface)',
              color: on ? 'var(--green)' : 'var(--text-muted)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <input
              type="checkbox"
              name="disease"
              value={key}
              checked={on}
              onChange={() => toggle(key)}
              style={{ accentColor: 'var(--green)' }}
            />
            {name}
          </label>
        )
      })}
    </div>
  )
}
