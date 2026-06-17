'use client'

import { useMemo, useState } from 'react'
import type { TrendPoint, TrendSeries } from '@/lib/dashboard'

const card = { border: '1px solid var(--border)', borderRadius: 6, padding: 16, background: 'var(--bg-card)' } as const

// Selectable look-back windows.
const WINDOWS = [
  { key: 30, label: '30d' },
  { key: 90, label: '90d' },
  { key: 365, label: '1y' },
] as const

// Palette for overlaid per-disease lines (matches the bar-chart accents).
const COLORS = ['var(--green)', 'var(--amber)', '#a78bfa', '#60a5fa', '#f472b6', '#34d399']

const W = 720      // viewBox width  — scales to container
const H = 220      // viewBox height
const PAD = { top: 12, right: 12, bottom: 22, left: 30 }

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
  // Diseases toggled off in split mode (by key).
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const canSplit = byDisease.length > 0
  const splitOn = split && canSplit

  const points = useMemo(() => data.slice(-win), [data, win])
  const len = points.length

  // Visible per-disease series, windowed + smoothed.
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

  // Combined series (used when not split, or as the y-scale fallback).
  const combined = useMemo(() => smoothSeries(points.map(p => p.count), smooth), [points, smooth])

  const max = Math.max(
    1,
    ...(splitOn ? lines.flatMap(l => l.values) : combined),
  )
  const total = points.reduce((s, p) => s + p.count, 0)

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (len <= 1 ? 0 : (i / (len - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const path = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const combinedLine = path(combined)
  const combinedArea = `${combinedLine} L${x(len - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`

  const ticks = [0, Math.round(max / 2), Math.ceil(max)]

  const btn = (active: boolean, color = accent) => ({
    padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--mono)',
    fontSize: 11, fontWeight: 700,
    border: `1px solid ${active ? color : 'var(--border)'}`,
    background: active ? color : 'transparent',
    color: active ? '#04130b' : 'var(--text-dim)',
  } as const)

  const toggleDisease = (key: string) =>
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Cases over time</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>· {total} in window</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WINDOWS.map(w => (
            <button key={w.key} type="button" onClick={() => setWin(w.key)} style={btn(win === w.key)}>{w.label}</button>
          ))}
          <button type="button" onClick={() => setSmooth(s => !s)} style={btn(smooth)} title="7-day trailing average">~avg</button>
          {canSplit && (
            <button type="button" onClick={() => setSplit(s => !s)} style={btn(splitOn)} title="Overlay one line per disease">
              by disease
            </button>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map(t => (
          <g key={t}>
            <line x1={PAD.left} y1={y(t)} x2={W - PAD.right} y2={y(t)} stroke="var(--border)" strokeWidth={1} strokeDasharray="2 3" />
            <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" fontSize={9} fill="var(--text-dim)" fontFamily="var(--mono)">{t}</text>
          </g>
        ))}

        {splitOn ? (
          lines.map(l => (
            <path key={l.key} d={path(l.values)} fill="none" stroke={l.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))
        ) : (
          <>
            <path d={combinedArea} fill="url(#trendFill)" />
            <path d={combinedLine} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
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
          <g>
            <line x1={x(hover)} y1={PAD.top} x2={x(hover)} y2={PAD.top + plotH} stroke={accent} strokeWidth={1} strokeOpacity={0.5} />
            {splitOn
              ? lines.map(l => <circle key={l.key} cx={x(hover)} cy={y(l.values[hover])} r={3} fill={l.color} stroke="var(--bg-card)" strokeWidth={1.5} />)
              : <circle cx={x(hover)} cy={y(combined[hover])} r={3.5} fill={accent} stroke="var(--bg-card)" strokeWidth={1.5} />}
            <text
              x={Math.min(W - PAD.right, Math.max(PAD.left, x(hover)))}
              y={PAD.top - 2}
              textAnchor={x(hover) > W / 2 ? 'end' : 'start'}
              fontSize={10} fontWeight={700} fill="var(--text)" fontFamily="var(--mono)"
            >
              {fmtDate(points[hover].date)}: {splitOn ? lines.reduce((s, l) => s + l.raw[hover].count, 0) : points[hover].count}
            </text>
          </g>
        )}

        <text x={PAD.left} y={H - 6} fontSize={9} fill="var(--text-dim)" fontFamily="var(--mono)">{fmtDate(points[0]?.date ?? '')}</text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize={9} fill="var(--text-dim)" fontFamily="var(--mono)">{fmtDate(points.at(-1)?.date ?? '')}</text>
      </svg>

      {splitOn && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {byDisease.map((s, i) => {
            const off = hidden.has(s.key)
            const color = COLORS[i % COLORS.length] ?? accent
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleDisease(s.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '3px 9px', borderRadius: 12, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                  border: '1px solid var(--border)', background: 'transparent',
                  color: off ? 'var(--text-dim)' : 'var(--text)',
                  opacity: off ? 0.5 : 1,
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {s.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
