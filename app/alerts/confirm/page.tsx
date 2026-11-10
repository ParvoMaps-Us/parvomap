import type { Metadata } from 'next'
import Link from 'next/link'
import { peekPendingSignup } from '@/lib/free-alerts'
import ConfirmButton from './ConfirmButton'

// Free ZIP alerts, the page the confirmation email links to. Loading this page
// changes nothing (mail scanners open links too); only the button does.
// Lives under /alerts on purpose: the root layout loads no Google Analytics
// there, so the one-time token in the URL is never sent to Google.

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Turn on alerts | ParvoMaps',
  robots: { index: false, follow: false },
}

const wrap = { maxWidth: 560, margin: '64px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const

export default async function ConfirmAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token = '' } = await searchParams
  const pending = await peekPendingSignup(token)

  if (!pending) {
    return (
      <main style={wrap}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>This link has expired</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
          Alert links work for 24 hours and only once. If your alerts are already on, you are all set. If not,
          sign up again from the map.
        </p>
        <Link href="/" style={{ color: 'var(--green)', fontSize: 14 }}>← Back to the map</Link>
      </main>
    )
  }

  const place = [pending.city, pending.state].filter(Boolean).join(', ')

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Turn on your free alerts</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
        We will email <strong style={{ color: 'var(--text)' }}>{pending.email}</strong> when a new disease case is
        added to the map within about 10 miles of ZIP <strong style={{ color: 'var(--text)' }}>{pending.zip}</strong>
        {place ? ` (${place})` : ''}, and when pet food is recalled. It is free. You can stop any time.
      </p>
      <ConfirmButton token={token} zip={pending.zip} />
    </main>
  )
}
