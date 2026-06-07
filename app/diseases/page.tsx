import type { Metadata } from 'next'
import Link from 'next/link'
import { DISEASE_MAP, CATEGORY_LABELS, type DiseaseCategory } from '@/lib/diseases'
import { getDiseaseCounts } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Dog Diseases We Track — Symptoms, Spread & Prevention | ParvoMaps',
  description: 'Learn about the canine diseases ParvoMaps tracks — parvo, distemper, kennel cough, leptospirosis, Lyme, RMSF, blue-green algae and more. Symptoms, how they spread, and prevention.',
  alternates: { canonical: 'https://www.parvomaps.us/diseases' },
}

const wrap = { maxWidth: 900, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const card = { border: '1px solid var(--border)', borderRadius: 8, padding: 18, background: 'var(--bg-card)', textDecoration: 'none', color: 'inherit', display: 'block' } as const

const ORDER: DiseaseCategory[] = ['infectious', 'tick-borne', 'environmental']

export default async function DiseasesIndexPage() {
  const counts = await getDiseaseCounts()
  const entries = Object.entries(DISEASE_MAP)

  return (
    <main style={wrap}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🦠 Dog diseases we track</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32, maxWidth: 640 }}>
        ParvoMaps tracks these canine diseases and hazards across the US. Tap any one for symptoms,
        how it spreads, prevention, and where it’s being reported right now.
      </p>

      {ORDER.map(cat => {
        const inCat = entries.filter(([, info]) => info.category === cat)
        if (inCat.length === 0) return null
        return (
          <section key={cat} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              {CATEGORY_LABELS[cat]}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {inCat.map(([slug, info]) => (
                <Link key={slug} href={`/diseases/${slug}`} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{info.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--green)', whiteSpace: 'nowrap' }}>
                      {counts[slug] ?? 0} reported
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, margin: '8px 0 0' }}>
                    {info.blurb.length > 110 ? info.blurb.slice(0, 110).trimEnd() + '…' : info.blurb}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 8 }}>
        Educational information only — not veterinary advice. If your dog is sick, contact your veterinarian.
      </p>
    </main>
  )
}
