import type { MetadataRoute } from 'next'
import { DISEASE_MAP } from '@/lib/diseases'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.parvomaps.us'
  const now = new Date()

  const diseasePages: MetadataRoute.Sitemap = Object.keys(DISEASE_MAP).map(slug => ({
    url: `${base}/diseases/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'hourly', // map pins change constantly
      priority: 1.0,
    },
    {
      url: `${base}/alerts`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${base}/outbreaks`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${base}/diseases`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${base}/recalls`,
      lastModified: now,
      changeFrequency: 'daily', // FDA feed refreshes; recalls change often
      priority: 0.8,
    },
    ...diseasePages,
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
