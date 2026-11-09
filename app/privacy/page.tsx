import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy — ParvoMaps',
  description: 'How ParvoMaps collects, uses, and protects your information.',
  path: '/privacy',
})

const wrap = { maxWidth: 760, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const h2 = { fontSize: 16, fontWeight: 700, margin: '28px 0 8px' } as const
const p = { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 12px' } as const
const li = { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 6 } as const
const ul = { margin: '0 0 12px', paddingLeft: 20, listStyleType: 'disc' as const }

const EMAIL = 'parvomaps.us@gmail.com'
const UPDATED = 'November 9, 2026'

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
        <li style={li}><strong>Report submissions.</strong> When you send a disease or lost-dog report, we collect the
          details you give us, like the disease or hazard, the location, and your notes. For lost-dog reports, this
          also includes a photo and any contact info you choose to share. The location can be a ZIP code, a place
          you type in or pin on the map, or your device location if you tap the location button.</li>
        <li style={li}><strong>Email address.</strong> Optionally provided to verify a report or receive alerts, and required
          for a subscription. We use it to contact you about your reports, alerts, and account.</li>
        <li style={li}><strong>Subscription &amp; payment.</strong> Payments, including subscriptions and one-time voluntary
          contributions, are processed by Stripe. We do not store your card
          number. We keep a Stripe customer ID, your plan, and subscription status.</li>
        <li style={li}><strong>Cookies.</strong> Google Analytics sets cookies named <code>_ga</code> and <code>_ga_*</code> so
          we can count visits. Pro Clinic users also get one sign-in cookie, <code>clinic_session</code>. We also save a
          small note in your browser so the welcome box only shows once. We do not use any of these for ads.</li>
        <li style={li}><strong>Automatically collected.</strong> Our hosting provider keeps standard server logs (IP
          address, browser type, and times) for security. Google Analytics also collects usage data. See
          “Analytics” below. When you send a report, we use your IP address to block spam, and we save the
          country it points to. We never show either one on the map.</li>
      </ul>

      <h2 style={h2}>How we use information</h2>
      <ul style={ul}>
        <li style={li}>To operate the map, publish verified reports, and send alerts you’ve requested.</li>
        <li style={li}>To verify reports, prevent abuse, and moderate harmful content.</li>
        <li style={li}>To manage subscriptions and provide Pro Clinic features.</li>
        <li style={li}>To respond to your messages and requests.</li>
        <li style={li}>To count visits and learn which pages help people, so we can make the site better.</li>
      </ul>
      <p style={p}>
        Published reports are public, including the location and the map pin. We remove your email and your
        notes before a report goes on the map. For lost-dog reports, we also show the contact info you give so
        finders can reach you.
      </p>

      <h2 style={h2}>Analytics</h2>
      <p style={p}>
        We use Google Analytics to count visits and see which pages help people. When a page loads, your browser
        sends Google details like the page address, the page title, the page you came from, your browser and device
        type, your screen size, and your language. Google uses your IP address to guess your general area, like
        your city.
      </p>
      <p style={p}>
        We also send a few simple events, like when someone sends a report, reads a blog post, or taps the donate
        button. These events do not include your name, email, or exact location. When you open an account, alert,
        sign-in, or unsubscribe page from a link, like one in our emails, we do not load Google Analytics. If you get
        to one of those pages from another page on our site, Google Analytics may count the visit, but not your email
        or sign-in code.
      </p>
      <p style={p}>
        To learn how Google uses this data, see{' '}
        <a href="https://policies.google.com/technologies/partner-sites" style={{ color: 'var(--green)' }}>how Google uses information from sites that use its services</a>.
        To stop Google Analytics on every site you visit, you can install Google’s{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" style={{ color: 'var(--green)' }}>opt-out browser add-on</a>.
      </p>

      <h2 style={h2}>Service providers</h2>
      <p style={p}>We share limited data with vendors who help us run the Service:</p>
      <ul style={ul}>
        <li style={li}><strong>Stripe</strong>: payment processing and billing.</li>
        <li style={li}><strong>Resend</strong>: transactional and alert emails.</li>
        <li style={li}><strong>OpenAI</strong>: automated image moderation of uploaded photos.</li>
        <li style={li}><strong>Upstash (Redis)</strong>: data storage.</li>
        <li style={li}><strong>Vercel</strong>: hosting, and Vercel Blob for lost-dog photo storage.</li>
        <li style={li}><strong>Cloudflare (R2)</strong>: encrypted off-site backups of Service data.</li>
        <li style={li}><strong>Photon / Zippopotam</strong>: converting ZIP codes and coordinates to place names.</li>
        <li style={li}><strong>Google</strong>: Google Analytics for site stats, and Google Fonts for the text on our pages.</li>
        <li style={li}><strong>OpenStreetMap</strong>: the map images. Your browser loads them from their servers.</li>
      </ul>
      <p style={p}>We do not sell your personal information or share it for targeted ads.</p>

      <h2 style={h2}>Data retention</h2>
      <ul style={ul}>
        <li style={li}>Parvovirus pins remain for 12 months; other disease pins for 90 days.</li>
        <li style={li}>Lost-dog reports and their photos are removed after 30 days, or sooner if marked found.</li>
        <li style={li}>Subscriber records are kept while your subscription is active and as needed for legal/accounting purposes.</li>
        <li style={li}>We keep encrypted off-site backups for up to 30 days. Information removed from the live Service may persist in these backups until they expire.</li>
      </ul>

      <h2 style={h2}>Your choices &amp; rights</h2>
      <p style={p}>
        You can unsubscribe from alert emails at any time via the link in those emails, and manage or cancel
        your subscription through the billing portal on your <Link href="/account" style={{ color: 'var(--green)' }}>account page</Link>.
        To request access to or deletion of your personal information, email us at{' '}
        <a href={`mailto:${EMAIL}`} style={{ color: 'var(--green)' }}>{EMAIL}</a>.
      </p>

      <h2 style={h2}>Do Not Track and Global Privacy Control</h2>
      <p style={p}>
        If your browser sends a Global Privacy Control or Do Not Track signal, we do not load Google Analytics for
        you. No ad networks run on our site.
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
