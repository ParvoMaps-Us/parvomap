import type { Metadata } from 'next'
import Link from 'next/link'
import { verifyUnsubToken } from '@/lib/magic-link'
import UnsubscribeButton from './UnsubscribeButton'
import { PAID_ALERTS_LIVE } from '@/lib/flags'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Unsubscribe | ParvoMaps',
  robots: { index: false, follow: false },
}

const wrap = { maxWidth: 560, margin: '64px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>
}) {
  const { e, t } = await searchParams
  const email = (e ?? '').trim().toLowerCase()
  const token = t ?? ''

  if (!verifyUnsubToken(email, token)) {
    return (
      <main style={wrap}>
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>Link not valid</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6 }}>
          This unsubscribe link looks invalid. Use the link at the bottom of any alert email, or go{' '}
          <Link href="/" style={{ color: 'var(--green)' }}>back to the map</Link>.
        </p>
      </main>
    )
  }

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Unsubscribe from alerts</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
        This stops all ParvoMaps alert emails for <strong style={{ color: 'var(--text)' }}>{email}</strong> and
        removes your alert settings.
        {PAID_ALERTS_LIVE && (
          <> It does <em>not</em> cancel a paid subscription. Manage billing at{' '}
            <Link href="/account" style={{ color: 'var(--green)' }}>parvomaps.us/account</Link>.</>
        )}
      </p>
      <UnsubscribeButton email={email} token={token} showBilling={PAID_ALERTS_LIVE} />
    </main>
  )
}
