import type { MetadataRoute } from 'next'
import { DISEASE_MAP } from '@/lib/diseases'
import { getArchivedRecalls } from '@/lib/recalls'
import { BLOG_POSTS } from '@/lib/blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.parvomaps.us'
  const now = new Date()

  // Per-recall detail pages from the archive (best-effort; empty if Redis down).
  const recallPages: MetadataRoute.Sitemap = (await getArchivedRecalls())
    .filter(r => typeof r.slug === 'string' && r.slug.length > 3 && r.slug !== 'undefined')
    .map(r => ({
      url: `${base}/recalls/${r.slug}`,
      lastModified: r.ts ? new Date(r.ts) : now,
      changeFrequency: 'monthly',
      priority: 0.5,
    }))

  const diseasePages: MetadataRoute.Sitemap = Object.keys(DISEASE_MAP).map(slug => ({
    url: `${base}/diseases/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date((post.dateModified ?? post.datePublished) + 'T00:00:00Z'),
    changeFrequency: 'monthly',
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
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...recallPages,
    ...diseasePages,
    ...blogPages,
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
