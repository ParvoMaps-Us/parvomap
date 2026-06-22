import type { Metadata } from 'next'

/**
 * Single source of truth for per-page metadata. Guarantees every page ships a
 * complete, self-consistent set: trimmed title/description, canonical URL, and a
 * FULL OpenGraph block (type + url + siteName + image) so pages don't silently
 * inherit/override away the site's OG image. Fixes the audit's OG + title/desc
 * length issues in one place.
 */
const SITE = 'https://www.parvomaps.us'
const OG_IMAGE = '/og-image.png'

/** Trim to a clean length without cutting a word mid-character. */
function clamp(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

export function buildMetadata({
  title,
  description,
  path = '',
  type = 'website',
}: {
  title: string
  description: string
  path?: string
  type?: 'website' | 'article'
}): Metadata {
  const url = `${SITE}${path}`
  const desc = clamp(description, 155) // meta description target; also feeds OG
  return {
    title: clamp(title, 60),
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: clamp(title, 60),
      description: clamp(description, 200),
      url,
      type,
      siteName: 'ParvoMaps',
      locale: 'en_US',
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'ParvoMaps — US canine disease & outbreak tracker' }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@parvomap',
      title: clamp(title, 60),
      description: desc,
      images: [OG_IMAGE],
    },
  }
}
