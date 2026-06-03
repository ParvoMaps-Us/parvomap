import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
              "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://unpkg.com https://*.tile.openstreetmap.org",
              "connect-src 'self' https://*.basemaps.cartocdn.com https://geocoding.geo.census.gov https://*.upstash.io",
              "worker-src blob:",
            ].join('; ')
          }
        ]
      }
    ]
  },
  webpack: (config: any) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    return config
  },
}

export default nextConfig
