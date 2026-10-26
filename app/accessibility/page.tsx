import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Accessibility — ParvoMaps',
  description: 'How ParvoMaps works to be usable by everyone, what we know is hard, and how to tell us.',
  path: '/accessibility',
})

const wrap = { maxWidth: 760, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const h2 = { fontSize: 16, fontWeight: 700, margin: '28px 0 8px' } as const
const p = { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 12px' } as const
const li = { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 6 } as const
const ul = { margin: '0 0 12px', paddingLeft: 20, listStyleType: 'disc' as const }

const EMAIL = 'parvomaps.us@gmail.com'
const UPDATED = 'October 25, 2026'

export default function AccessibilityPage() {
  return (
    <main style={wrap}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Accessibility</h1>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 24 }}>Last updated: {UPDATED}</p>

      <p style={p}>
        ParvoMaps is a free tool for dog owners, and it should work for every dog owner, including people who use
        screen readers, keyboard navigation, magnification, or other assistive technology.
      </p>

      <h2 style={h2}>Our goal</h2>
      <p style={p}>
        We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1, level AA. We test the site with automated
        accessibility checks (axe-core) and by hand, and we fix what we find. The last full check was on {UPDATED}.
      </p>

      <h2 style={h2}>What we know is hard</h2>
      <ul style={ul}>
        <li style={li}><strong>The interactive map.</strong> Maps are visual by nature. Every outbreak on the map is also
          listed as text on the <Link href="/outbreaks" style={{ textDecoration: 'underline' }}>outbreaks by state</Link> pages, which work with a screen
          reader and a keyboard.</li>
        <li style={li}><strong>Linked news sources.</strong> Reports link to outside news and government sites, which we
          don&apos;t control.</li>
      </ul>

      <h2 style={h2}>Tell us if something doesn&apos;t work</h2>
      <p style={p}>
        If any part of ParvoMaps is hard to use, email <a href={`mailto:${EMAIL}`}>{EMAIL}</a> with the page and what
        happened. We read every message and aim to reply within 5 business days. If you need information from the
        site in another format, ask and we&apos;ll send it.
      </p>
    </main>
  )
}
