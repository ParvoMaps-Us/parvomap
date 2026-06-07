import type { Metadata } from 'next'
import Link from 'next/link'
import { verifyUnsubToken } from '@/lib/magic-link'
import UnsubscribeButton from './UnsubscribeButton'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Unsubscribe — ParvoMaps',
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
          This unsubscribe link looks invalid. You can manage alerts from{' '}
          <Link href="/alerts" style={{ color: 'var(--green)' }}>parvomaps.us/alerts</Link>.
        </p>
      </main>
    )
  }

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Unsubscribe from alerts</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
        This stops outbreak and lost-dog alert emails for <strong style={{ color: 'var(--text)' }}>{email}</strong>.
        It does <em>not</em> cancel your subscription — manage billing at{' '}
        <Link href="/account" style={{ color: 'var(--green)' }}>parvomaps.us/account</Link>.
      </p>
      <UnsubscribeButton email={email} token={token} />
    </main>
  )
}
