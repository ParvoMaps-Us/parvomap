/**
 * Blog content source (Option B from docs/blog-playbook.md): a typed array, the
 * same pattern that drives lib/diseases.ts and lib/recalls.ts. New posts are
 * added to BLOG_POSTS and flow automatically into the index, the post route, and
 * app/sitemap.ts. Body is a small block model (heading / paragraph / image) that
 * supports the things posts need: headings, paragraphs with inline links, and an
 * in-body image. Keep copy free of em dashes.
 */

/** A run of text inside a paragraph, optionally a link. Strings render as plain
 *  text; objects render as an <a href>. Internal links are the priority here. */
export type InlineSpan = string | { text: string; href: string }

export type BlogBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; content: InlineSpan[] }
  | { type: 'image'; src: string; alt: string; caption?: string }

export interface BlogFaq {
  question: string
  answer: string
}

export interface BlogPost {
  /** lowercase, hyphenated, keyword-rich */
  slug: string
  title: string
  description: string
  /** ISO date, e.g. "2026-06-23" */
  datePublished: string
  dateModified?: string
  author: string
  /** Path under /public, e.g. "/blog/<slug>/cover.jpg" (landscape, ~1200x630) */
  coverImage: string
  coverAlt: string
  readingMinutes: number
  body: BlogBlock[]
  /** Optional FAQ block. When present, renders an FAQPage JSON-LD. */
  faqs?: BlogFaq[]
}

/**
 * Posts, newest first. Replace the placeholder once real content is provided.
 * Every post must link OUT to real pages and is linked IN from /blog (the index
 * reachable from the header) so it never becomes an orphan.
 */
const POSTS: BlogPost[] = [
  {
    slug: 'welcome-to-the-parvomaps-blog',
    title: 'Welcome to the ParvoMaps Blog',
    description: 'A placeholder post to verify the blog system: the index, the post route, metadata, structured data, and the sitemap entry.',
    datePublished: '2026-06-23',
    author: 'ParvoMaps',
    coverImage: '/og-image.png',
    coverAlt: 'ParvoMaps logo over a map of the United States',
    readingMinutes: 2,
    body: [
      {
        type: 'paragraph',
        content: [
          'This is a placeholder post used to confirm the blog scaffold works end to end. Real articles about canine disease, prevention, and outbreak awareness will replace it.',
        ],
      },
      {
        type: 'heading',
        text: 'What ParvoMaps does',
      },
      {
        type: 'paragraph',
        content: [
          'ParvoMaps is a community-powered map of US canine disease outbreaks. You can browse the ',
          { text: 'live outbreak map', href: '/' },
          ', read about every condition we track on the ',
          { text: 'diseases hub', href: '/diseases' },
          ', see ',
          { text: 'outbreaks by state', href: '/outbreaks' },
          ', and check current ',
          { text: 'dog food recalls', href: '/recalls' },
          '.',
        ],
      },
      {
        type: 'image',
        src: '/og-image.png',
        alt: 'ParvoMaps US canine disease tracker',
        caption: 'Placeholder in-body image.',
      },
      {
        type: 'heading',
        text: 'Why a blog',
      },
      {
        type: 'paragraph',
        content: [
          'Articles let us explain symptoms, spread, and prevention in plain language, and link readers to the right page for their situation. For example, a parvo guide can point straight to ',
          { text: 'parvovirus in dogs', href: '/diseases/parvo' },
          ' and to ',
          { text: 'outbreak alerts', href: '/alerts' },
          '.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is ParvoMaps a substitute for a veterinarian?',
        answer: 'No. ParvoMaps shares community-reported data for awareness only. If your dog may be sick, contact your veterinarian.',
      },
      {
        question: 'Where does the outbreak data come from?',
        answer: 'Reports are submitted by the community and by news and clinic sources, then shown on the live map.',
      },
    ],
  },
]

/** Posts sorted newest-first by datePublished. */
export const BLOG_POSTS: BlogPost[] = [...POSTS].sort(
  (a, b) => Date.parse(b.datePublished) - Date.parse(a.datePublished),
)

export function getPostBySlug(slug: string): BlogPost | null {
  return BLOG_POSTS.find(p => p.slug === slug) ?? null
}
