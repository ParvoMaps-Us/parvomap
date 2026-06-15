import type { Metadata } from 'next'
import Link from 'next/link'
import RequestLinkForm from './RequestLinkForm'

export const metadata: Metadata = {
  title: 'Manage Alerts — ParvoMaps',
  description: 'Fine-tune your ParvoMaps outbreak alerts — ZIP, radius, diseases, and lost-dog notifications. Alerts switch on automatically when you subscribe.',
}

export default function AlertsPage() {
  return (
    <main style={{ maxWidth: 620, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>🔔 Manage your outbreak alerts</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
        When you subscribe, alerts switch on automatically for your area — no setup needed. Use this page
        any time to <strong style={{ color: 'var(--text)' }}>fine-tune them</strong>: change your ZIP, radius,
        which diseases to watch, or whether to include lost dogs. Enter your subscriber email and we’ll send
        a private link to your preferences.
      </p>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 20, background: 'var(--bg-card)' }}>
        <RequestLinkForm />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 18, lineHeight: 1.6 }}>
        Not a subscriber yet? <Link href="/pro" style={{ color: 'var(--green)' }}>Become a Guardian →</Link>
      </p>
    </main>
  )
}
