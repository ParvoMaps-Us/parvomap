import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { PAID_ALERTS_LIVE } from '@/lib/flags'

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service — ParvoMaps',
  description: 'The terms governing your use of ParvoMaps.',
  path: '/terms',
})

const wrap = { maxWidth: 760, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const h2 = { fontSize: 16, fontWeight: 700, margin: '28px 0 8px' } as const
const p = { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 12px' } as const
const li = { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 6 } as const
const ul = { margin: '0 0 12px', paddingLeft: 20, listStyleType: 'disc' as const }

const EMAIL = 'parvomaps.us@gmail.com'
const UPDATED = 'October 1, 2026'

// The paid tier (Guardian / Guardian Annual / Pro Clinic) is OFF —
// see lib/flags.ts PAID_ALERTS_LIVE. /pro, /clinic, and /alerts all 404 while
// it's off, and /account has nothing to manage. Terms describing live
// subscription billing, a founding-rate price lock, and a Pro Clinic data
// license were still published alongside that — a page making billing
// promises for a product the site itself refuses to serve. Rewritten
// 2026-10-01 to drop those sections. They live in BILLING_TERMS.md (sibling
// of this file) so they can be pasted back in verbatim when PAID_ALERTS_LIVE
// flips to true — don't re-draft them from scratch, the Founding Guardian
// clause in particular took real care to get right.
export default function TermsPage() {
  return (
    <main style={wrap}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Terms of Service</h1>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 24 }}>Last updated: {UPDATED}</p>

      <p style={p}>
        These Terms of Service (“Terms”) govern your use of parvomaps.us (the “Service”). By using the
        Service you agree to these Terms. If you do not agree, do not use the Service.
      </p>

      <h2 style={h2}>The Service</h2>
      <p style={p}>
        ParvoMaps is a free, community-powered map of reported canine diseases, hazards, and lost dogs. Reports
        are submitted by users and are <strong>not independently verified or guaranteed</strong>. The Service is
        provided for general informational purposes only and is <strong>not veterinary, medical, or professional
        advice</strong>. Always consult a licensed veterinarian about your animal’s health.
      </p>

      <h2 style={h2}>Your submissions</h2>
      <ul style={ul}>
        <li style={li}>You are responsible for the content you submit and represent that it is accurate to the best of your knowledge and that you have the right to share it.</li>
        <li style={li}>You grant us a non-exclusive, worldwide, royalty-free license to host, display, and distribute your submissions as part of operating the Service (e.g. showing reports on the public map).</li>
        <li style={li}>Do not submit false, misleading, unlawful, infringing, or personal information about others without permission.</li>
      </ul>

      <h2 style={h2}>Acceptable use</h2>
      <ul style={ul}>
        <li style={li}>Don’t abuse, scrape, overload, or attempt to disrupt or gain unauthorized access to the Service.</li>
        <li style={li}>Don’t upload harmful, illegal, or graphic content, or use the Service to harass others.</li>
        <li style={li}>We may remove content or suspend access at our discretion to protect the Service and its users.</li>
      </ul>

      <h2 style={h2}>Voluntary contributions</h2>
      <ul style={ul}>
        <li style={li}>You may choose to make a one-time voluntary contribution to support the site (&ldquo;chip in&rdquo;). Contributions are optional and do not unlock any features, subscription benefits, or services — ParvoMaps has no paid tier at this time.</li>
        <li style={li}>ParvoMaps is not a registered charity or nonprofit. Contributions are <strong>not tax-deductible</strong> as charitable donations.</li>
        <li style={li}>Contributions are processed by Stripe and, except where required by law, are non-refundable.</li>
      </ul>

      <h2 style={h2}>Disclaimers</h2>
      <p style={p}>
        The Service is provided “as is” and “as available,” without warranties of any kind, express or implied,
        including accuracy, completeness, fitness for a particular purpose, or non-infringement. We do not
        warrant that reports are accurate or that the Service will be uninterrupted or error-free.
      </p>

      <h2 style={h2}>Limitation of liability</h2>
      <p style={p}>
        To the maximum extent permitted by law, ParvoMaps will not be liable for any indirect, incidental,
        special, consequential, or punitive damages, or any loss arising from your use of (or reliance on) the
        Service. Our total liability for any claim will not exceed $100.
      </p>

      <h2 style={h2}>Indemnification</h2>
      <p style={p}>
        You agree to indemnify and hold ParvoMaps harmless from claims arising out of your submissions or your
        misuse of the Service or violation of these Terms.
      </p>

      <h2 style={h2}>Governing law</h2>
      <p style={p}>
        These Terms are governed by the laws of the State of Utah, USA, without regard to its conflict-of-laws
        rules. Any disputes will be resolved in the state or federal courts located in Utah.
      </p>

      <h2 style={h2}>Changes</h2>
      <p style={p}>We may update these Terms from time to time; continued use after changes means you accept them. Material changes are reflected by the “Last updated” date above.</p>

      <h2 style={h2}>Contact</h2>
      <p style={p}>
        Questions about these Terms? Email <a href={`mailto:${EMAIL}`} style={{ color: 'var(--green)' }}>{EMAIL}</a>.
      </p>

      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 24 }}>
        See also our <Link href="/privacy" style={{ color: 'var(--green)' }}>Privacy Policy</Link>.
      </p>
    </main>
  )
}

// Dev-time guard: if the paid tier ever goes live, these terms MUST be
// restored from BILLING_TERMS.md before anyone can check out, or Guardian
// subscribers sign up with no billing/cancellation/refund terms at all.
if (PAID_ALERTS_LIVE && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[app/terms] PAID_ALERTS_LIVE is true but the billing sections were never restored. ' +
    'Paste BILLING_TERMS.md back into app/terms/page.tsx before shipping.'
  )
}
