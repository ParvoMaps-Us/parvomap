import type { Metadata } from 'next'
import Link from 'next/link'
import { getRecallsForList, isFoodRecall, recallKind, RECALL_COPY, FDA_PET_RECALLS_URL } from '@/lib/recalls'
import { buildMetadata } from '@/lib/seo'

// Sibling of /recalls. Same FDA feed, opposite half of it: everything that is
// NOT food. Kept apart because the advice genuinely differs — you don't tell an
// owner to "stop feeding" an injectable, and you never tell them to quietly stop
// a prescribed drug without a vet in the loop.
export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Dog Medication & Supplement Recalls — FDA List | ParvoMaps',
    description:
      'Current FDA recalls of veterinary medications, pet supplements, and vet products. What to do if your dog is on a recalled drug, and how to check your lot number.',
    path: '/recalls/medications',
  }),
  keywords:
    'dog medication recall, pet medication recall, veterinary drug recall, dog supplement recall, FDA animal drug recall, recalled dog medicine, pet medicine recall 2026',
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
  ['Particulate or foreign material', 'Glass fibers, metal, or other fragments found in a vial or tablet - the most common reason an injectable gets pulled.'],
  ['Sterility failure', 'A product meant to be sterile may not be, which matters most for anything injected.'],
  ['Wrong potency', 'The dose in the bottle does not match the dose on the label, in either direction.'],
  ['Cross contamination', 'Traces of a different drug carried over on shared manufacturing equipment.'],
  ['Labelling or packaging errors', 'Wrong species, wrong strength, or wrong directions printed on the package.'],
  ['Stability problems', 'The product degrades before its printed expiration date.'],
]

export default async function MedicationRecallsPage() {
  const all = await getRecallsForList()
  const recalls = all.filter(r => !isFoodRecall(r))
  const foodCount = all.length - recalls.length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.parvomaps.us/recalls/medications#webpage',
        url: 'https://www.parvomaps.us/recalls/medications',
        name: 'Dog Medication & Supplement Recalls — FDA List',
        description: 'Current FDA recalls of veterinary medications, pet supplements, and vet products.',
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
          { '@type': 'ListItem', position: 3, name: 'Medication & Supplement Recalls', item: 'https://www.parvomaps.us/recalls/medications' },
        ],
      },
    ],
  }

  return (
    <main style={wrap}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ marginBottom: 18 }}>
        <Link href="/recalls" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Dog food recalls</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Medication &amp; Supplement Recalls</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
        Current FDA recalls of veterinary medications, pet supplements, and vet products, refreshed
        automatically. Food recalls are tracked separately on the{' '}
        <Link href="/recalls" style={{ color: '#60a5fa' }}>dog food recall page</Link>, because what you
        should do about a recalled drug is not what you should do about a recalled bag of kibble.
      </p>

      {/* ─── The one thing people get wrong ─── */}
      <div style={{ ...card, borderColor: 'var(--green)', marginBottom: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>⚠️ Do not just stop a prescribed medication</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Set the recalled package aside, then call your vet before the next dose is due. Stopping a
          drug your dog was prescribed carries its own risk, and your vet can move you to an unaffected
          lot or an alternative. This is not veterinary advice.
        </div>
      </div>

      {/* ─── Live recall list ─── */}
      <Section title="Current FDA recalls">
        {recalls.length === 0 ? (
          <div style={{ ...card, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            No pet medication or supplement recalls are in the FDA&apos;s latest alerts right now. That can
            change daily - check the{' '}
            <a href={FDA_PET_RECALLS_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>
              FDA animal recall page
            </a>{' '}
            for the complete, authoritative list.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recalls.map(r => (
              <Link key={r.slug} href={`/recalls/${r.slug}`} style={{ ...card, textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                  {RECALL_COPY[recallKind(r)].label}
                  {r.date && ` · ${r.date}`} · FDA
                </div>
                {r.summary && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.summary}…</div>}
                <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 8 }}>See recall details →</div>
              </Link>
            ))}
          </div>
        )}

        <Link href="/recalls" style={{ ...card, textDecoration: 'none', color: 'inherit', display: 'block', marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
            🥣 Dog food recalls
            {foodCount > 0 && <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}> · {foodCount} listed</span>}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Recalled kibble, raw, and treats, with what to do if your brand is on the list.
          </div>
        </Link>

        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12, lineHeight: 1.6 }}>
          Source: FDA Recalls &amp; Safety Alerts. ParvoMaps mirrors the FDA feed for convenience - the{' '}
          <a href={FDA_PET_RECALLS_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>
            FDA animal recall page
          </a>{' '}
          is the complete, authoritative source.
        </p>
      </Section>

      {/* ─── Evergreen SEO content ─── */}
      <Section title="If your dog's medication is recalled">
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.9 }}>
          <li><strong>Set it aside, then call your vet</strong> before the next dose - do not stop a prescribed drug on your own.</li>
          <li><strong>Read the lot number and expiration date</strong> off the box, bottle, or vial; not every lot of a product is affected.</li>
          <li><strong>Check those against the FDA notice</strong>, and ask your vet or pharmacy for an unaffected lot.</li>
          <li><strong>Watch your dog</strong> for a reaction at the dose or injection site, swelling, lethargy, or anything unusual.</li>
          <li><strong>Keep the packaging</strong> - you may need it for a refund, and your vet may need the lot number.</li>
          <li><strong>Report a problem</strong> to the FDA&apos;s Safety Reporting Portal if your dog had a reaction.</li>
        </ol>
      </Section>

      <Section title="Common reasons a pet medication gets recalled">
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
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Track canine disease near you</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
          See real-time parvo, distemper, and other canine outbreak reports on the live ParvoMaps map.
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
