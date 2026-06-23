import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BLOG_POSTS } from '@/lib/blog'
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

export default function BlogIndexPage() {
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

      {BLOG_POSTS.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>No posts yet. Check back soon.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {BLOG_POSTS.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={card}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1200 / 630', background: 'var(--bg-surface)' }}>
                <Image
                  src={post.coverImage}
                  alt={post.coverAlt}
                  fill
                  sizes="(max-width: 700px) 100vw, 420px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.35 }}>{post.title}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 10px' }}>{post.description}</p>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                  {fmtDate(post.datePublished)} · {post.readingMinutes} min read
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
