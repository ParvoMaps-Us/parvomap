import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ParvoMap — US Canine Disease & Tick Outbreak Tracker | Parvo, Lyme, RMSF, Kennel Cough & More',
  description: 'The only real-time, crowdsourced map tracking canine disease outbreaks across the United States. Report parvo, distemper, Lyme disease, Rocky Mountain spotted fever, kennel cough, leptospirosis, dog flu, giardia, tick sightings, and blue-green algae dangers near you.',
  keywords: 'parvo map, canine parvovirus tracker, dog disease outbreak map, parvo outbreak near me, kennel cough map, distemper outbreak, leptospirosis dogs, blue green algae dog warning, dog flu tracker, canine disease surveillance, parvotrack alternative',
  metadataBase: new URL('https://parvomaps.us'),
  openGraph: {
    type: 'website',
    url: 'https://parvomaps.us/',
    title: 'ParvoMap — Real-Time US Canine Disease Outbreak Tracker',
    description: 'Community-powered map tracking parvo, distemper, kennel cough, leptospirosis, blue-green algae, and more. See what infectious diseases are reported near you. Protect your dog.',
    siteName: 'ParvoMap',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@parvomap',
    title: 'ParvoMap — US Canine Disease Outbreak Tracker',
    description: 'Real-time crowdsourced map of parvo, distemper, kennel cough & blue-green algae dangers for dogs across the US.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
