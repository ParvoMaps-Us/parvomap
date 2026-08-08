import type { MetadataRoute } from 'next'
import { DISEASE_MAP } from '@/lib/diseases'
import { getArchivedRecalls } from '@/lib/recalls'
import { BLOG_POSTS } from '@/lib/blog'
import { STATES } from '@/lib/states'
import { getLocationCombos } from '@/lib/dashboard'

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

  // One page per state. These target the searches only this site can answer
  // ("is there parvo in <my state> right now"), unlike the national symptom
  // terms the blog competes for.
  const statePages: MetadataRoute.Sitemap = STATES.map(s => ({
    url: `${base}/outbreaks/${s.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  // County and disease-in-state pages, but only combos that actually have data
  // (best-effort; empty if Redis is down). Empty combos render noindex/404, so
  // listing them would just burn crawl budget.
  let comboPages: MetadataRoute.Sitemap = []
  try {
    const { counties, diseases } = await getLocationCombos()
    const slugFor = new Map(STATES.map(s => [s.abbr, s.slug]))
    comboPages = [
      ...counties.flatMap(c => {
        const st = slugFor.get(c.state)
        return st ? [{ url: `${base}/outbreaks/${st}/${c.slug}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.6 }] : []
      }),
      ...diseases.flatMap(d => {
        const st = slugFor.get(d.state)
        return st ? [{ url: `${base}/outbreaks/${st}/${d.disease}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.6 }] : []
      }),
    ]
  } catch { /* leave empty */ }

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
      url: `${base}/recalls/medications`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...recallPages,
    ...diseasePages,
    ...statePages,
    ...comboPages,
    ...blogPages,
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
