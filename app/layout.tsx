import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import KeyboardModality from '@/components/KeyboardModality'

export const metadata: Metadata = {
  title: 'ParvoMaps — US Canine Disease & Prevention Map',
  description: "Real-time map of canine health hazards across the US — parvo and distemper outbreaks, confirmed rabies cases, and blue-green algae advisories. See what has been confirmed near you before you go.",
  keywords: 'parvo map, canine parvovirus tracker, dog disease outbreak map, parvo outbreak near me, kennel cough map, distemper outbreak, leptospirosis dogs, blue green algae dog warning, dog flu tracker, canine disease surveillance, parvotrack alternative, rabies map, rabies alert near me, rabid animal reported near me, rabies cases by county, dog rabies prevention, algae bloom dog warning map',
  metadataBase: new URL('https://www.parvomaps.us'),
  alternates: {
    canonical: 'https://www.parvomaps.us',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.parvomaps.us/',
    title: 'ParvoMaps — US Canine Disease & Prevention Map',
    description: 'Community-powered map of parvo and distemper outbreaks, confirmed rabies cases, and blue-green algae advisories across the US. See what has been confirmed near you before you go. Protect your dog.',
    siteName: 'ParvoMaps',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ParvoMaps — US canine disease & prevention map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@parvomap',
    title: 'ParvoMaps — US Canine Disease & Prevention Map',
    description: 'Real-time map of parvo, distemper, rabies and blue-green algae dangers for dogs across the US. Check before you go.',
    images: ['/og-image.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ParvoMaps',
  url: 'https://www.parvomaps.us',
  description: 'Real-time map of canine health hazards across the United States, including parvo and distemper outbreaks, confirmed rabies cases, and blue-green algae advisories.',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'Dog owners, veterinarians, animal facilities',
  },
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Nonce set by middleware.ts — required for inline scripts under the CSP.
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google tag (gtag.js) — GA4 property G-8LNR8C5J3F.
            Nonce'd so it's trusted under the strict-dynamic CSP; gtag.js then
            loads its own chunks via strict-dynamic. */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-8LNR8C5J3F"
          nonce={nonce}
        />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-8LNR8C5J3F');`,
          }}
        />
      </head>
      <body>
        <KeyboardModality />
        {children}
      </body>
    </html>
  )
}
