'use client'

import { useState } from 'react'
import type { PlanKey } from '@/lib/stripe'

interface Tier {
  plan: PlanKey
  name: string
  price: string
  cadence: string
  blurb: string
  features: string[]
  highlight?: boolean
  cta: string
}

const TIERS: Tier[] = [
  {
    plan: 'guardian-monthly',
    name: 'Guardian',
    price: '$5',
    cadence: '/month',
    blurb: 'For pet owners who want a heads-up before trouble reaches their block.',
    features: [
      'Real-time outbreak alerts for your ZIP',
      'Lost-dog notifications near you',
      'Unlimited reports & photo uploads',
      'Email + push alerts',
    ],
    cta: 'Become a Guardian',
    highlight: true,
  },
  {
    plan: 'guardian-annual',
    name: 'Guardian — Annual',
    price: '$50',
    cadence: '/year',
    blurb: 'Same Guardian coverage, two months free.',
    features: [
      'Everything in Guardian monthly',
      'Save ~17% vs monthly',
      'One bill a year',
    ],
    cta: 'Get annual',
  },
  {
    plan: 'pro-clinic',
    name: 'Pro Clinic',
    price: '$49',
    cadence: '/month',
    blurb: 'For vet clinics, shelters, rescues, laboratories & pharmaceutical companies tracking caseloads across a region.',
    features: [
      'County- & state-wide outbreak dashboards',
      'Verified-reporter badge on your posts',
      'Exportable case data (CSV/API)',
      'Priority support',
    ],
    cta: 'Start Pro Clinic',
  },
]

export default function PricingCards() {
  const [loading, setLoading] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkout(plan: PlanKey) {
    setError(null)
    setLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not start checkout.')
        setLoading(null)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
      setLoading(null)
    }
  }

  return (
    <>
      {error && (
        <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
          {error}
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 18,
        }}
      >
        {TIERS.map(t => (
          <div
            key={t.plan}
            style={{
              border: `1px solid ${t.highlight ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: 24,
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: t.highlight ? '0 0 24px var(--green-glow, transparent)' : 'none',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t.name}</div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 30, fontWeight: 800 }}>{t.price}</span>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{t.cadence}</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16, minHeight: 56 }}>
              {t.blurb}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
              {t.features.map((f, i) => (
                <li key={i} style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5, marginBottom: 8, paddingLeft: 18, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: 'var(--green)' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => checkout(t.plan)}
              disabled={loading !== null}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: loading !== null ? 'default' : 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 13,
                fontWeight: 700,
                background: t.highlight ? 'var(--green)' : 'transparent',
                color: t.highlight ? '#04130b' : 'var(--text)',
                outline: t.highlight ? 'none' : '1px solid var(--border)',
                opacity: loading !== null && loading !== t.plan ? 0.5 : 1,
              }}
            >
              {loading === t.plan ? 'Redirecting…' : t.cta}
            </button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
        Sales tax is calculated at checkout based on your location. Cancel anytime.
      </p>
    </>
  )
}
