'use client'
import Link from 'next/link'
import { PAID_ALERTS_LIVE } from '@/lib/flags'
import { DONATE_URL } from '@/lib/donate'

// Header/menu CTA. While PAID_ALERTS_LIVE is off this is the chip-in button
// (donation lane); when the paid tier relaunches it reverts to the /pro upsell
// with no call-site changes. Fires a GA4 event tagged with placement either way
// so we can see which spot drives clicks. No-ops when gtag is absent.
export default function ProCta({
  location,
  className = 'btn-pro',
  children,
  onClick,
}: {
  location: string
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}) {
  function handleClick() {
    try {
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
      gtag?.('event', PAID_ALERTS_LIVE ? 'pro_cta_click' : 'donate_cta_click', { cta_location: location })
    } catch {
      /* ignore */
    }
    onClick?.()
  }

  if (!PAID_ALERTS_LIVE) {
    return (
      <a href={DONATE_URL} className={className} onClick={handleClick} target="_blank" rel="noopener noreferrer">
        {children ?? '💚 Keep ParvoMaps Free'}
      </a>
    )
  }

  return (
    <Link href="/pro" className={className} onClick={handleClick}>
      {children ?? '🔔 Get Outbreak Alerts'}
    </Link>
  )
}
