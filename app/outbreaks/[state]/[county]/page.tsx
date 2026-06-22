import type { Metadata } from 'next'
import Link from 'next/link'

// Stub feature — keep it out of the search index until it's real content.
export const metadata: Metadata = {
  title: 'Outbreak detail — ParvoMaps',
  robots: { index: false, follow: true },
}

export default function Page() {
  return (
    <main style={{ maxWidth: 520, margin: '80px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 18 }}>Coming soon</h1>
      <p style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 12 }}>
        County outbreak detail isn&apos;t live yet. In the meantime, see{' '}
        <Link href="/outbreaks" style={{ color: 'var(--green)' }}>US outbreaks by state</Link> or the{' '}
        <Link href="/" style={{ color: 'var(--green)' }}>live map</Link>.
      </p>
    </main>
  )
}
