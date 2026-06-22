import type { Metadata } from 'next'
import Link from 'next/link'
import { getRecallsForList, FDA_PET_RECALLS_URL } from '@/lib/recalls'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Dog Food Recalls — Current FDA Recall List | ParvoMaps',
    description:
      'Current dog and cat food recalls from the FDA, what to do if your brand is recalled, common reasons, and how to check. Updated automatically.',
    path: '/recalls',
  }),
  keywords:
    'dog food recall, dog food recall 2026, cat food recall, pet food recall, recalled dog food, FDA dog food recall, dog treats recall, dog food recall list',
}

const wrap = { maxWidth: 760, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const card = { border: '1px solid var(--border)', borderRadius: 8, padding: 18, background: 'var(--bg-card)' } as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{title}</h2>
      {children}
    </div>
  )
}

const RECALL_REASONS = [
  ['Salmonella & Listeria', 'Bacterial contamination - a risk to pets and the people who handle the food.'],
  ['Aflatoxin', 'A mold toxin from contaminated grains; has killed dogs in past recalls.'],
  ['Excess Vitamin D', 'A formulation error that can cause kidney damage at high doses.'],
  ['Foreign material', 'Metal, plastic, or other fragments found in the product.'],
  ['Elevated thyroid hormone', 'Beef/gland contamination in some treats and foods.'],
  ['Nutritional imbalance', 'Too little or too much of a required nutrient.'],
]

export default async function RecallsPage() {
  const recalls = await getRecallsForList()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.parvomaps.us/recalls#webpage',
        url: 'https://www.parvomaps.us/recalls',
        name: 'Dog Food Recalls — Current FDA Recall List',
        description: 'Current dog and cat food recalls from the FDA, what to do if your brand is recalled, common reasons, and how to check.',
        inLanguage: 'en-US',
        isPartOf: { '@type': 'WebSite', name: 'ParvoMaps', url: 'https://www.parvomaps.us' },
        ...(recalls.length > 0
          ? {
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: recalls.map((r, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  name: r.title,
                  url: `https://www.parvomaps.us/recalls/${r.slug}`,
                })),
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.parvomaps.us/' },
          { '@type': 'ListItem', position: 2, name: 'Dog Food Recalls', item: 'https://www.parvomaps.us/recalls' },
        ],
      },
    ],
  }

  return (
    <main style={wrap}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Dog Food Recalls</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
        Current dog and cat food recalls reported by the U.S. Food &amp; Drug Administration, refreshed
        automatically. Below the list you&apos;ll find what to do if your pet&apos;s food is recalled, the most
        common reasons, and how to check your brand.
      </p>

      {/* ─── Primary CTA into the map ─── */}
      <div style={{ ...card, background: 'var(--green)', color: '#04130b', borderColor: 'transparent', marginBottom: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🗺️ Is illness spreading near you?</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
          Recalls are only half the picture. See real-time parvo, distemper, and other canine disease
          reports on the live ParvoMaps outbreak map - and report a case to warn your neighbors.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/" style={{ padding: '11px 22px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: '#04130b', color: 'var(--green)' }}>
            View the outbreak map →
          </Link>
          <Link href="/#report" style={{ padding: '11px 22px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 700, border: '1px solid #04130b', color: '#04130b' }}>
            Report a case
          </Link>
        </div>
      </div>

      {/* ─── Live recall list ─── */}
      <Section title="Current FDA recalls">
        {recalls.length === 0 ? (
          <div style={{ ...card, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            No pet-food recalls are in the FDA&apos;s latest alerts right now. That can change daily -
            check the{' '}
            <a href={FDA_PET_RECALLS_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>
              FDA pet-food recall page
            </a>{' '}
            for the complete, authoritative list.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recalls.map(r => (
              <Link key={r.slug} href={`/recalls/${r.slug}`} style={{ ...card, textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{r.title}</div>
                {r.date && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>{r.date} · FDA</div>}
                {r.summary && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.summary}…</div>}
                <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 8 }}>See recall details →</div>
              </Link>
            ))}
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12, lineHeight: 1.6 }}>
          Source: FDA Recalls &amp; Safety Alerts. ParvoMaps mirrors the FDA feed for convenience - the{' '}
          <a href={FDA_PET_RECALLS_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>
            FDA pet-food recall page
          </a>{' '}
          is the complete, authoritative source.
        </p>
      </Section>

      {/* ─── Recall-alert upsell (paid Guardian perk) ─── */}
      <div style={{ ...card, borderColor: 'var(--green)', marginBottom: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>🛑 Get alerted the moment your brand is recalled</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
          Tell us what food your dog eats and we&apos;ll email you the instant the FDA recalls it - no
          checking back required. Included with a ParvoMaps Guardian membership, from $5/mo.
        </div>
        <Link href="/pro" style={{ display: 'inline-block', padding: '11px 22px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'var(--green)', color: '#04130b' }}>
          Set up recall alerts →
        </Link>
      </div>

      {/* ─── Evergreen SEO content ─── */}
      <Section title="If your dog's food is recalled">
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.9 }}>
          <li><strong>Stop feeding it immediately</strong> and seal or set aside the bag - note the lot number and best-by date.</li>
          <li><strong>Check the recall details</strong> against your product&apos;s lot/UPC; not every bag of a brand is always affected.</li>
          <li><strong>Watch your dog</strong> for vomiting, diarrhea, lethargy, or loss of appetite, and call your vet if anything seems off.</li>
          <li><strong>Keep the packaging</strong> - you may need it for a refund and it helps your vet and the manufacturer.</li>
          <li><strong>Report a problem</strong> to the FDA&apos;s Safety Reporting Portal if your pet got sick.</li>
        </ol>
      </Section>

      <Section title="Common reasons pet food gets recalled">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RECALL_REASONS.map(([name, desc]) => (
            <div key={name} style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Closing CTA ─── */}
      <div style={{ ...card, textAlign: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Protect your dog beyond the bowl</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
          Track canine disease outbreaks near you in real time and get alerts for your area.
        </div>
        <Link href="/" style={{ display: 'inline-block', padding: '12px 26px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'var(--green)', color: '#04130b' }}>
          Open the ParvoMaps outbreak map →
        </Link>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 24 }}>
        Recall information is sourced from the FDA and provided for convenience only - always verify with the
        official FDA listing and your veterinarian. Not veterinary advice.
      </p>
    </main>
  )
}
