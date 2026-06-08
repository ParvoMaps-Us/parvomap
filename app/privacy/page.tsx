import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — ParvoMaps',
  description: 'How ParvoMaps collects, uses, and protects your information.',
  alternates: { canonical: 'https://www.parvomaps.us/privacy' },
}

const wrap = { maxWidth: 760, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const h2 = { fontSize: 16, fontWeight: 700, margin: '28px 0 8px' } as const
const p = { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 12px' } as const
const li = { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 6 } as const
const ul = { margin: '0 0 12px', paddingLeft: 20, listStyleType: 'disc' as const }

const EMAIL = 'parvomaps.us@gmail.com'
const UPDATED = 'June 7, 2026'

export default function PrivacyPage() {
  return (
    <main style={wrap}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 24 }}>Last updated: {UPDATED}</p>

      <p style={p}>
        This Privacy Policy explains how ParvoMaps (“we,” “us”) collects, uses, and shares information when
        you use parvomaps.us (the “Service”). By using the Service you agree to this policy.
      </p>

      <h2 style={h2}>Information we collect</h2>
      <ul style={ul}>
        <li style={li}><strong>Report submissions.</strong> When you submit a disease or lost-dog report, we collect the
          details you provide — disease/hazard type, approximate location (ZIP or map coordinates), notes,
          and, for lost-dog reports, a photo and any public contact info you choose to include.</li>
        <li style={li}><strong>Email address.</strong> Optionally provided to verify a report or receive alerts, and required
          for a subscription. We use it to contact you about your reports, alerts, and account.</li>
        <li style={li}><strong>Subscription &amp; payment.</strong> Payments are processed by Stripe. We do not store your card
          number — we keep a Stripe customer ID, your plan, and subscription status.</li>
        <li style={li}><strong>Cookies.</strong> We set one strictly-necessary cookie, <code>clinic_session</code>, to keep Pro
          Clinic users signed in to their dashboard. It is not used for advertising or cross-site tracking.</li>
        <li style={li}><strong>Automatically collected.</strong> Standard server logs (IP address, browser type, timestamps)
          collected by our hosting provider for security and reliability.</li>
      </ul>

      <h2 style={h2}>How we use information</h2>
      <ul style={ul}>
        <li style={li}>To operate the map, publish verified reports, and send alerts you’ve requested.</li>
        <li style={li}>To verify reports, prevent abuse, and moderate harmful content.</li>
        <li style={li}>To manage subscriptions and provide Pro Clinic features.</li>
        <li style={li}>To respond to your messages and requests.</li>
      </ul>
      <p style={p}>
        Published map reports are intentionally public and have personal contact details stripped, except for
        lost-dog reports, where the contact info you provide is shown so finders can reach you.
      </p>

      <h2 style={h2}>Service providers</h2>
      <p style={p}>We share limited data with vendors who help us run the Service:</p>
      <ul style={ul}>
        <li style={li}><strong>Stripe</strong> — payment processing and billing.</li>
        <li style={li}><strong>Resend</strong> — transactional and alert emails.</li>
        <li style={li}><strong>OpenAI</strong> — automated image moderation of uploaded photos.</li>
        <li style={li}><strong>Upstash (Redis)</strong> — data storage.</li>
        <li style={li}><strong>Vercel</strong> — hosting, and Vercel Blob for lost-dog photo storage.</li>
        <li style={li}><strong>Photon / Zippopotam</strong> — converting ZIP codes and coordinates to place names.</li>
      </ul>
      <p style={p}>We do not sell your personal information.</p>

      <h2 style={h2}>Data retention</h2>
      <ul style={ul}>
        <li style={li}>Parvovirus pins remain for 12 months; other disease pins for 90 days.</li>
        <li style={li}>Lost-dog reports and their photos are removed after 30 days, or sooner if marked found.</li>
        <li style={li}>Subscriber records are kept while your subscription is active and as needed for legal/accounting purposes.</li>
      </ul>

      <h2 style={h2}>Your choices &amp; rights</h2>
      <p style={p}>
        You can unsubscribe from alert emails at any time via the link in those emails, and manage or cancel
        your subscription through the billing portal on your <Link href="/account" style={{ color: 'var(--green)' }}>account page</Link>.
        To request access to or deletion of your personal information, email us at{' '}
        <a href={`mailto:${EMAIL}`} style={{ color: 'var(--green)' }}>{EMAIL}</a>.
      </p>

      <h2 style={h2}>Children</h2>
      <p style={p}>The Service is not directed to children under 13, and we do not knowingly collect their information.</p>

      <h2 style={h2}>Changes</h2>
      <p style={p}>We may update this policy from time to time. Material changes will be reflected by the “Last updated” date above.</p>

      <h2 style={h2}>Contact</h2>
      <p style={p}>
        Questions about this policy? Email <a href={`mailto:${EMAIL}`} style={{ color: 'var(--green)' }}>{EMAIL}</a>.
      </p>

      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 24 }}>
        See also our <Link href="/terms" style={{ color: 'var(--green)' }}>Terms of Service</Link>.
      </p>
    </main>
  )
}
