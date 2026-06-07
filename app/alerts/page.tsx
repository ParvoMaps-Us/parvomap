import type { Metadata } from 'next'
import Link from 'next/link'
import RequestLinkForm from './RequestLinkForm'

export const metadata: Metadata = {
  title: 'Alerts — ParvoMaps',
  description: 'Get notified when outbreaks or lost dogs are reported near you. A ParvoMaps subscriber perk.',
}

export default function AlertsPage() {
  return (
    <main style={{ maxWidth: 620, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>🔔 Your outbreak alerts</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
        Subscribers get an email the moment a new verified case or lost dog is reported in their area.
        Enter your subscriber email and we’ll send you a private link to set your preferences.
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
