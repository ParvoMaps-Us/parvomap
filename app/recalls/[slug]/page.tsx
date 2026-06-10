import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRecallBySlug, FDA_PET_RECALLS_URL } from '@/lib/recalls'

const wrap = { maxWidth: 720, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const card = { border: '1px solid var(--border)', borderRadius: 8, padding: 18, background: 'var(--bg-card)' } as const

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const recall = await getRecallBySlug(slug)
  if (!recall) return { title: 'Recall not found | ParvoMaps' }
  const title = `${recall.title} | Dog Food Recall | ParvoMaps`
  const description = recall.summary || `Details on the ${recall.title} pet food recall reported by the FDA.`
  return {
    title,
    description,
    alternates: { canonical: `https://www.parvomaps.us/recalls/${slug}` },
    openGraph: { title, description, url: `https://www.parvomaps.us/recalls/${slug}`, type: 'article' },
  }
}

export default async function RecallDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const recall = await getRecallBySlug(slug)
  if (!recall) notFound()

  const url = `https://www.parvomaps.us/recalls/${slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        '@id': `${url}#article`,
        headline: recall.title.slice(0, 110),
        description: recall.summary || undefined,
        ...(recall.ts ? { datePublished: new Date(recall.ts).toISOString() } : {}),
        url,
        isPartOf: { '@type': 'WebSite', name: 'ParvoMaps', url: 'https://www.parvomaps.us' },
        publisher: { '@type': 'Organization', name: 'ParvoMaps', url: 'https://www.parvomaps.us' },
        about: { '@type': 'Thing', name: 'Pet food recall' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.parvomaps.us/' },
          { '@type': 'ListItem', position: 2, name: 'Dog Food Recalls', item: 'https://www.parvomaps.us/recalls' },
          { '@type': 'ListItem', position: 3, name: recall.title.slice(0, 70), item: url },
        ],
      },
    ],
  }

  return (
    <main style={wrap}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ marginBottom: 18 }}>
        <Link href="/recalls" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← All dog food recalls</Link>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.3, margin: '0 0 8px' }}>{recall.title}</h1>
      {recall.date && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 18 }}>Reported {recall.date} · U.S. Food &amp; Drug Administration</div>}

      {recall.summary && (
        <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>{recall.summary}…</p>
      )}

      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>What to do</div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.9 }}>
          <li>Stop feeding the product and set the bag aside - note the lot number and best-by date.</li>
          <li>Check those against the official FDA notice; not every lot of a brand is always affected.</li>
          <li>Watch your dog for vomiting, diarrhea, lethargy, or appetite loss, and call your vet if anything seems off.</li>
          <li>Keep the packaging for a refund and return or dispose of the product as the notice directs.</li>
        </ol>
      </div>

      <a href={recall.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'var(--green)', color: '#04130b', marginBottom: 8 }}>
        Read the official FDA notice →
      </a>
      <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, margin: '12px 0 28px' }}>
        Source: FDA Recalls &amp; Safety Alerts. The{' '}
        <a href={FDA_PET_RECALLS_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>FDA pet-food recall page</a>{' '}
        is the complete, authoritative source.
      </p>

      {/* Recall-alert upsell */}
      <div style={{ ...card, borderColor: 'var(--green)', marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🛑 Never miss a recall for your brand</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
          Tell us what your dog eats and we&apos;ll email you the instant the FDA recalls it. Included with a ParvoMaps Guardian membership.
        </div>
        <Link href="/pro" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'var(--green)', color: '#04130b' }}>
          Set up recall alerts →
        </Link>
      </div>

      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Track disease outbreaks near you</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
          See real-time parvo, distemper, and other canine disease reports on the live ParvoMaps map.
        </div>
        <Link href="/" style={{ display: 'inline-block', padding: '11px 22px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'var(--green)', color: '#04130b' }}>
          Open the outbreak map →
        </Link>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 24 }}>
        Recall information is sourced from the FDA and provided for convenience only - always verify with the official FDA listing and your veterinarian. Not veterinary advice.
      </p>
    </main>
  )
}
