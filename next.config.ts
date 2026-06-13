import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  // Don't advertise the framework (x-powered-by: Next.js).
  poweredByHeader: false,
  // The Content-Security-Policy lives in middleware.ts because it carries a
  // per-request nonce. These static headers have no per-request part, so they
  // stay here.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
          // Enforce HTTPS for 2 years incl. all subdomains; preload-eligible.
          // Commitment: every *.parvomaps.us host must stay HTTPS-only.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ]
      }
    ]
  },
}

export default nextConfig
