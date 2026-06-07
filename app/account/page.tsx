import type { Metadata } from 'next'
import Link from 'next/link'
import PortalForm from './PortalForm'

export const metadata: Metadata = {
  title: 'Account — ParvoMaps',
  description: 'Manage your ParvoMaps subscription and billing.',
}

export default function AccountPage() {
  return (
    <main style={{ maxWidth: 560, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>👤 Your account</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
        Update your payment method, see invoices, or cancel anytime in the secure Stripe billing portal.
        Enter the email you subscribed with and we’ll take you there.
      </p>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 20, background: 'var(--bg-card)' }}>
        <PortalForm />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 18, lineHeight: 1.6 }}>
        Looking to change what you get alerted about? Head to{' '}
        <Link href="/alerts" style={{ color: 'var(--green)' }}>your alerts →</Link>
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.6 }}>
        Pro Clinic subscriber? Open your{' '}
        <Link href="/clinic" style={{ color: 'var(--green)' }}>clinic dashboard →</Link>
      </p>
    </main>
  )
}
