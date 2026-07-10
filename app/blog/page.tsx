import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BLOG_POSTS, BLOG_CATEGORIES, type BlogPost } from '@/lib/blog'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Blog: Canine Disease & Prevention | ParvoMaps',
  description: 'Plain-language guides on dog disease, prevention, and outbreak awareness from ParvoMaps, the community US canine disease tracker.',
  path: '/blog',
})

const wrap = { maxWidth: 860, margin: '48px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const
const card = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--bg-card)',
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  overflow: 'hidden',
} as const

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** A single post card. Reused across every category section. */
function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} style={card}>
      {/* zIndex lifts the photo above the site-wide scanline overlay (body::before, z 9999) so covers render clean. */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1200 / 630', background: 'var(--bg-surface)', zIndex: 10000 }}>
        <Image
          src={post.coverImage}
          alt={post.coverAlt}
          fill
          sizes="(max-width: 700px) 100vw, 420px"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div style={{ padding: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.35 }}>{post.title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 10px' }}>{post.description}</p>
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
          {fmtDate(post.datePublished)} · {post.readingMinutes} min read
        </div>
      </div>
    </Link>
  )
}

export default function BlogIndexPage() {
  // Group posts by category, preserving the newest-first order of BLOG_POSTS.
  const sections = BLOG_CATEGORIES.map(cat => ({
    ...cat,
    posts: BLOG_POSTS.filter(p => p.category === cat.name),
  })).filter(s => s.posts.length > 0)

  return (
    <main style={wrap}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to the map</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>ParvoMaps Blog</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
        Plain-language guides on canine disease, prevention, and outbreak awareness. Start with the{' '}
        <Link href="/diseases" style={{ color: 'var(--green)' }}>diseases hub</Link> or the{' '}
        <Link href="/outbreaks" style={{ color: 'var(--green)' }}>live outbreaks by state</Link>.
      </p>

      {sections.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>No posts yet. Check back soon.</p>
      ) : (
        sections.map(section => (
          <section key={section.name} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px' }}>{section.name}</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.6, margin: '0 0 16px' }}>{section.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              {section.posts.map(post => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
