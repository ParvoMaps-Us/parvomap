import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  // Don't advertise the framework (x-powered-by: Next.js).
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://unpkg.com https://*.tile.openstreetmap.org https://*.public.blob.vercel-storage.com",
              "connect-src 'self' https://parvomaps.us https://www.parvomaps.us https://*.basemaps.cartocdn.com https://geocoding.geo.census.gov https://photon.komoot.io https://api.zippopotam.us https://*.upstash.io https://*.resend.com",
              "worker-src blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join('; ')
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
        ]
      }
    ]
  },
}

export default nextConfig
