import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/check', '/pro'],
    },
    sitemap: 'https://www.parvomaps.us/sitemap.xml',
    host: 'https://www.parvomaps.us',
  }
}
