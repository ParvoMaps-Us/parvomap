import type { Metadata } from 'next'
import Link from 'next/link'
import RequestLinkForm from './RequestLinkForm'

export const metadata: Metadata = {
  title: 'Pro Clinic dashboard — ParvoMaps',
  description: 'Case trends, regional breakdowns, and data export for veterinary clinics and shelters. A ParvoMaps Pro Clinic perk.',
}

export default function ClinicPage() {
  return (
    <main style={{ maxWidth: 620, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>🏥 Pro Clinic dashboard</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
        Pro Clinic subscribers get a regional view of verified case data — trends, breakdowns by
        disease and reporter, and CSV export for your county or state. Enter your clinic’s
        subscriber email and we’ll send a private link to your dashboard.
      </p>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 20, background: 'var(--bg-card)' }}>
        <RequestLinkForm />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 18, lineHeight: 1.6 }}>
        Not a Pro Clinic yet? <Link href="/pro" style={{ color: 'var(--green)' }}>See the Pro Clinic plan →</Link>
      </p>
    </main>
  )
}
