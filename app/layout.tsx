import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'

export const metadata: Metadata = {
  title: 'ParvoMaps — US Canine Disease & Tick Outbreak Tracker | Parvo, Lyme, RMSF, Kennel Cough & More',
  description: 'The only real-time, crowdsourced map tracking canine disease outbreaks across the United States. Report parvo, distemper, Lyme disease, Rocky Mountain spotted fever, kennel cough, leptospirosis, dog flu, giardia, tick sightings, and blue-green algae dangers near you.',
  keywords: 'parvo map, canine parvovirus tracker, dog disease outbreak map, parvo outbreak near me, kennel cough map, distemper outbreak, leptospirosis dogs, blue green algae dog warning, dog flu tracker, canine disease surveillance, parvotrack alternative',
  metadataBase: new URL('https://www.parvomaps.us'),
  alternates: {
    canonical: 'https://www.parvomaps.us',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.parvomaps.us/',
    title: 'ParvoMaps — Real-Time US Canine Disease Outbreak Tracker',
    description: 'Community-powered map tracking parvo, distemper, kennel cough, leptospirosis, blue-green algae, and more. See what infectious diseases are reported near you. Protect your dog.',
    siteName: 'ParvoMaps',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ParvoMaps — US canine pathogen tracking & mapping',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@parvomap',
    title: 'ParvoMaps — US Canine Disease Outbreak Tracker',
    description: 'Real-time crowdsourced map of parvo, distemper, kennel cough & blue-green algae dangers for dogs across the US.',
    images: ['/og-image.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ParvoMaps',
  url: 'https://www.parvomaps.us',
  description: 'Real-time crowdsourced map tracking canine disease outbreaks across the United States including parvo, distemper, Lyme disease, kennel cough, and more.',
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
      <body>{children}</body>
    </html>
  )
}
