import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'

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
const UPDATED = 'June 10, 2026'

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
        ParvoMaps is a community-powered map of reported canine diseases, hazards, and lost dogs. Reports are
        submitted by users and are <strong>not independently verified or guaranteed</strong>. The Service is provided for
        general informational purposes only and is <strong>not veterinary, medical, or professional advice</strong>. Always
        consult a licensed veterinarian about your animal’s health.
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

      <h2 style={h2}>Subscriptions &amp; billing</h2>
      <ul style={ul}>
        <li style={li}>Paid plans (Guardian, Guardian Annual, Pro Clinic) are billed on a recurring basis through Stripe until cancelled.</li>
        <li style={li}>Applicable sales tax is calculated at checkout based on your location.</li>
        <li style={li}>You can cancel anytime via the billing portal on your <Link href="/account" style={{ color: 'var(--green)' }}>account page</Link>; access continues through the end of the paid period.</li>
        <li style={li}>Except where required by law, payments are non-refundable.</li>
      </ul>

      <h2 style={h2}>Founding Guardian price lock</h2>
      <ul style={ul}>
        <li style={li}>The first 1,000 subscribers to a Guardian or Guardian Annual plan (&ldquo;Founding Guardians&rdquo;) lock in the founding rate in effect at sign-up — currently $5/month or $50/year — for as long as their subscription remains <strong>continuously active</strong>.</li>
        <li style={li}>Founding slots are limited to 1,000 in total and are allocated in the order checkout is completed. Once all slots are claimed, the offer closes and new subscriptions are billed at the then-current regular price.</li>
        <li style={li}>The locked rate is tied to the subscription, not the person. If you cancel or your subscription lapses for any reason, the founding rate is forfeited; re-subscribing later is at the then-current regular price, even if founding slots remain.</li>
        <li style={li}>The price lock applies to the recurring subscription fee only. Applicable sales tax is still calculated at checkout and may change. We may add, change, or remove plan features over time; the locked rate applies to the Guardian plan as it then exists.</li>
        <li style={li}>This offer may be withdrawn or modified for sign-ups that have not yet occurred. Any such change does not affect the locked rate of existing Founding Guardians.</li>
      </ul>

      <h2 style={h2}>Pro Clinic data</h2>
      <p style={p}>
        Pro Clinic data exports and API access are provided for your internal and professional use. You may not
        resell or redistribute the data in a way that re-identifies individuals or misrepresents it as
        independently verified case data.
      </p>

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
        Service. Our total liability for any claim will not exceed the amount you paid us in the 12 months
        before the claim.
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
