import type { Metadata } from 'next'
import Link from 'next/link'
import PricingCards from './PricingCards'
import FoundingBanner from './FoundingBanner'

export const metadata: Metadata = {
  title: 'Go Pro — ParvoMaps',
  description: 'Real-time outbreak and lost-dog alerts for pet owners, vet clinics, and shelters.',
}

export default async function ProPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { checkout } = await searchParams

  return (
    <main style={{ maxWidth: 940, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>
          ← Back to the map
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Stay ahead of the next outbreak</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
          ParvoMaps Pro turns the community map into a personal early-warning system — alerts the
          moment parvo, a disease cluster, or a lost dog shows up near you.
        </p>
      </div>

      {checkout === 'success' && (
        <div style={{ border: '1px solid var(--green)', background: 'var(--green-dim)', borderRadius: 6, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--green)', textAlign: 'center' }}>
          🎉 You’re in! Your subscription is active and <strong>your alerts are already on</strong> for your
          area — check your email to confirm or fine-tune them.
        </div>
      )}
      {checkout === 'cancelled' && (
        <div style={{ border: '1px solid var(--amber)', background: 'var(--amber-dim)', borderRadius: 6, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--amber)', textAlign: 'center' }}>
          Checkout cancelled — no charge was made. Come back anytime.
        </div>
      )}

      <FoundingBanner />

      <PricingCards />
    </main>
  )
}
