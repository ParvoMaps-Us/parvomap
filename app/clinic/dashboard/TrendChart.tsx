'use client'

import { useMemo, useState } from 'react'
import type { TrendPoint, TrendSeries } from '@/lib/dashboard'

const card = { border: '1px solid var(--border)', borderRadius: 10, padding: 18, background: 'var(--bg-card)' } as const

// Selectable look-back windows.
const WINDOWS = [
  { key: 30, label: '30d' },
  { key: 90, label: '90d' },
  { key: 365, label: '1y' },
] as const

// Palette for overlaid per-disease lines (matches the bar-chart accents).
const COLORS = ['var(--green)', 'var(--amber)', '#a78bfa', '#60a5fa', '#f472b6', '#34d399']

const W = 760      // viewBox width  — scales to container
const H = 240      // viewBox height
const PAD = { top: 16, right: 14, bottom: 26, left: 34 }

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** 7-day trailing average, to smooth daily noise into a readable trend. */
function smoothSeries(counts: number[], on: boolean): number[] {
  if (!on) return counts
  return counts.map((_, i) => {
    const slice = counts.slice(Math.max(0, i - 6), i + 1)
    return slice.reduce((s, v) => s + v, 0) / slice.length
  })
}

/** Monotone-cubic (Fritsch–Carlson) bezier path through evenly-spaced points —
 *  gives smooth curves that never overshoot into negative case counts. */
function curve(vals: number[], x: (i: number) => number, y: (v: number) => number): string {
  const n = vals.length
  if (n === 0) return ''
  if (n === 1) return `M${x(0).toFixed(1)},${y(vals[0]).toFixed(1)}`
  const dx = x(1) - x(0)
  const sec = vals.slice(1).map((v, i) => (v - vals[i]) / dx)
  const m = vals.map((_, i) => {
    if (i === 0) return sec[0]
    if (i === n - 1) return sec[n - 2]
    return (sec[i - 1] + sec[i]) / 2
  })
  for (let i = 0; i < n - 1; i++) {
    if (sec[i] === 0) { m[i] = 0; m[i + 1] = 0; continue }
    const a = m[i] / sec[i], b = m[i + 1] / sec[i]
    const s = a * a + b * b
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * sec[i]; m[i + 1] = t * b * sec[i] }
  }
  // y() is linear in value, so convert each value-space slope m to a pixel slope.
  const k = y(1) - y(0)
  let d = `M${x(0).toFixed(1)},${y(vals[0]).toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const x1 = x(i), x2 = x(i + 1)
    const cp1y = y(vals[i]) + (m[i] * dx / 3) * k
    const cp2y = y(vals[i + 1]) - (m[i + 1] * dx / 3) * k
    d += ` C${(x1 + dx / 3).toFixed(1)},${cp1y.toFixed(1)} ${(x2 - dx / 3).toFixed(1)},${cp2y.toFixed(1)} ${x2.toFixed(1)},${y(vals[i + 1]).toFixed(1)}`
  }
  return d
}

/** "Nice" rounded ceiling + evenly-spaced ticks for the y-axis. */
function niceTicks(max: number): number[] {
  if (max <= 4) return Array.from({ length: max + 1 }, (_, i) => i)
  const step = Math.ceil(max / 4)
  const top = step * 4
  return [0, step, step * 2, step * 3, top]
}

export default function TrendChart({
  data,
  byDisease,
  accent = 'var(--green)',
}: {
  data: TrendPoint[]
  byDisease: TrendSeries[]
  accent?: string
}) {
  const [win, setWin] = useState<number>(90)
  const [smooth, setSmooth] = useState(true)
  const [split, setSplit] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const canSplit = byDisease.length > 0
  const splitOn = split && canSplit

  const points = useMemo(() => data.slice(-win), [data, win])
  const len = points.length

  const lines = useMemo(() => {
    if (!splitOn) return []
    return byDisease
      .filter(s => !hidden.has(s.key))
      .map(s => ({
        key: s.key,
        label: s.label,
        color: COLORS[byDisease.indexOf(s) % COLORS.length] ?? accent,
        values: smoothSeries(s.points.slice(-win).map(p => p.count), smooth),
        raw: s.points.slice(-win),
      }))
  }, [splitOn, byDisease, hidden, win, smooth, accent])

  const combined = useMemo(() => smoothSeries(points.map(p => p.count), smooth), [points, smooth])

  const dataMax = Math.max(1, ...(splitOn ? lines.flatMap(l => l.values) : combined))
  const ticks = niceTicks(Math.ceil(dataMax))
  const max = ticks[ticks.length - 1] || 1
  const total = points.reduce((s, p) => s + p.count, 0)

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (len <= 1 ? 0 : (i / (len - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH

  const combinedLine = curve(combined, x, y)
  const combinedArea = `${combinedLine} L${x(len - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`

  const seg = (active: boolean) => ({
    padding: '5px 11px', cursor: 'pointer', fontFamily: 'var(--mono)',
    fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 6,
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text-dim)',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.25)' : 'none',
    transition: 'color .15s, background .15s',
  } as const)

  const pill = (active: boolean, color = accent) => ({
    padding: '5px 11px', cursor: 'pointer', fontFamily: 'var(--mono)',
    fontSize: 11, fontWeight: 700, borderRadius: 7,
    border: `1px solid ${active ? color : 'var(--border)'}`,
    background: active ? color : 'transparent',
    color: active ? '#04130b' : 'var(--text-dim)',
    transition: 'all .15s',
  } as const)

  const toggleDisease = (key: string) =>
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  // Tooltip placement as % of the chart-area box (svg scales uniformly to it).
  const hx = hover !== null ? (x(hover) / W) * 100 : 0
  const tipRight = hx > 55

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Cases over time</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{total.toLocaleString()} reports in window</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', gap: 2, padding: 2, borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            {WINDOWS.map(w => (
              <button key={w.key} type="button" onClick={() => setWin(w.key)} style={seg(win === w.key)}>{w.label}</button>
            ))}
          </div>
          <button type="button" onClick={() => setSmooth(s => !s)} style={pill(smooth)} title="7-day trailing average">~ smooth</button>
          {canSplit && (
            <button type="button" onClick={() => setSplit(s => !s)} style={pill(splitOn)} title="Overlay one line per disease">
              by disease
            </button>
          )}
        </div>
      </div>

      <div style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.30" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map(t => (
            <g key={t}>
              <line x1={PAD.left} y1={y(t)} x2={W - PAD.right} y2={y(t)} stroke="var(--border)" strokeWidth={1} strokeOpacity={t === 0 ? 0.9 : 0.4} />
              <text x={PAD.left - 8} y={y(t) + 3} textAnchor="end" fontSize={9.5} fill="var(--text-dim)" fontFamily="var(--mono)">{t}</text>
            </g>
          ))}

          {splitOn ? (
            lines.map(l => (
              <path key={l.key} d={curve(l.values, x, y)} fill="none" stroke={l.color} strokeWidth={2.25}
                strokeLinejoin="round" strokeLinecap="round"
                style={{ opacity: hover === null ? 1 : 0.92, transition: 'opacity .15s' }} />
            ))
          ) : (
            <>
              <path d={combinedArea} fill="url(#trendFill)" />
              <path d={combinedLine} fill="none" stroke={accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            </>
          )}

          {/* Invisible hit columns drive the hover tooltip. */}
          {points.map((p, i) => {
            const colW = plotW / Math.max(1, len)
            return (
              <rect key={p.date} x={x(i) - colW / 2} y={PAD.top} width={Math.max(1, colW)} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} />
            )
          })}

          {hover !== null && (
            <g style={{ pointerEvents: 'none' }}>
              <line x1={x(hover)} y1={PAD.top} x2={x(hover)} y2={PAD.top + plotH} stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.6} />
              {splitOn
                ? lines.map(l => <circle key={l.key} cx={x(hover)} cy={y(l.values[hover])} r={3.5} fill={l.color} stroke="var(--bg-card)" strokeWidth={2} />)
                : <circle cx={x(hover)} cy={y(combined[hover])} r={4} fill={accent} stroke="var(--bg-card)" strokeWidth={2} />}
            </g>
          )}

          <text x={PAD.left} y={H - 7} fontSize={9.5} fill="var(--text-dim)" fontFamily="var(--mono)">{fmtDate(points[0]?.date ?? '')}</text>
          <text x={W - PAD.right} y={H - 7} textAnchor="end" fontSize={9.5} fill="var(--text-dim)" fontFamily="var(--mono)">{fmtDate(points.at(-1)?.date ?? '')}</text>
        </svg>

        {hover !== null && (
          <div
            style={{
              position: 'absolute', top: 0, [tipRight ? 'right' : 'left']: `${tipRight ? 100 - hx : hx}%`,
              transform: `translateX(${tipRight ? '-' : ''}10px)`,
              pointerEvents: 'none', minWidth: 120, zIndex: 2,
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8,
              padding: '8px 10px', boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              fontFamily: 'var(--mono)', fontSize: 11,
            }}
          >
            <div style={{ color: 'var(--text-dim)', marginBottom: 6, fontSize: 10 }}>{fmtDate(points[hover].date)}</div>
            {splitOn ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {lines
                  .map(l => ({ label: l.label, color: l.color, n: l.raw[hover].count }))
                  .sort((a, b) => b.n - a.n)
                  .map(r => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                      <span style={{ color: 'var(--text-muted)', flex: 1, whiteSpace: 'nowrap' }}>{r.label}</span>
                      <span style={{ color: 'var(--text)', fontWeight: 700 }}>{r.n}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{points[hover].count}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>cases</span>
              </div>
            )}
          </div>
        )}
      </div>

      {splitOn && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {byDisease.map((s, i) => {
            const off = hidden.has(s.key)
            const color = COLORS[i % COLORS.length] ?? accent
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleDisease(s.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '4px 11px', borderRadius: 20, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                  border: `1px solid ${off ? 'var(--border)' : color}`,
                  background: off ? 'transparent' : `color-mix(in srgb, ${color} 14%, transparent)`,
                  color: off ? 'var(--text-dim)' : 'var(--text)',
                  opacity: off ? 0.55 : 1, transition: 'all .15s',
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, opacity: off ? 0.4 : 1, display: 'inline-block' }} />
                {s.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
