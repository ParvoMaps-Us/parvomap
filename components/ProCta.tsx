'use client'
import Link from 'next/link'

// Pro upgrade CTA. Fires a GA4 pro_cta_click tagged with where it was clicked
// (header, mobile_menu, report_success, …) so we can see which placement drives
// /pro visits and sales. No-ops when gtag is absent.
export default function ProCta({
  location,
  className = 'btn-pro',
  children = '🔔 Get Outbreak Alerts',
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
      gtag?.('event', 'pro_cta_click', { cta_location: location })
    } catch {
      /* ignore */
    }
    onClick?.()
  }

  return (
    <Link href="/pro" className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
