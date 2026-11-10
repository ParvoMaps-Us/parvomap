'use client'

// The one clickable part of the insurance box. Client-side only so the click can be
// counted in GA4 by placement (no-ops when gtag is absent, e.g. GPC/DNT visitors).
export default function InsuranceLink({
  href,
  placement,
  children,
}: {
  href: string
  placement: string
  children: React.ReactNode
}) {
  function handleClick() {
    try {
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
      gtag?.('event', 'insurance_cta_click', { cta_location: placement })
    } catch {
      /* ignore */
    }
  }

  return (
    <a
      href={href}
      className="ins-btn"
      onClick={handleClick}
      target="_blank"
      rel="sponsored nofollow noopener"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
