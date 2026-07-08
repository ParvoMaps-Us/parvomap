import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { BLOG_POSTS, getPostBySlug, type InlineSpan } from '@/lib/blog'
import { buildMetadata } from '@/lib/seo'
import BlogAnalytics from '@/components/BlogAnalytics'

const SITE = 'https://www.parvomaps.us'

export function generateStaticParams() {
  return BLOG_POSTS.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post not found | ParvoMaps' }
  return buildMetadata({
    title: `${post.title} | ParvoMaps`,
    description: post.description,
    path: `/blog/${slug}`,
    type: 'article',
    image: { url: post.coverImage, alt: post.coverAlt },
  })
}

const wrap = { maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'var(--mono)', color: 'var(--text)' } as const

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** Render a paragraph's inline spans: strings as text, objects as crawlable links. */
function Spans({ content }: { content: InlineSpan[] }) {
  return (
    <>
      {content.map((span, i) =>
        typeof span === 'string'
          ? <span key={i}>{span}</span>
          : <Link key={i} href={span.href} style={{ color: 'var(--green)' }}>{span.text}</Link>,
      )}
    </>
  )
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const url = `${SITE}/blog/${slug}`
  const coverAbs = `${SITE}${post.coverImage}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: post.title,
        description: post.description,
        image: [coverAbs],
        datePublished: post.datePublished,
        dateModified: post.dateModified ?? post.datePublished,
        author: { '@type': post.author === 'ParvoMaps' ? 'Organization' : 'Person', name: post.author },
        publisher: {
          '@type': 'Organization',
          name: 'ParvoMaps',
          logo: { '@type': 'ImageObject', url: `${SITE}/og-image.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        inLanguage: 'en-US',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: url },
        ],
      },
      ...(post.faqs && post.faqs.length > 0
        ? [{
            '@type': 'FAQPage',
            '@id': `${url}#faq`,
            mainEntity: post.faqs.map(f => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
          }]
        : []),
    ],
  }

  return (
    <main style={wrap}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogAnalytics slug={slug} title={post.title} />

      <div style={{ marginBottom: 16 }}>
        <Link href="/blog" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>← All posts</Link>
      </div>

      <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.25, margin: '0 0 10px' }}>{post.title}</h1>
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 20 }}>
        {fmtDate(post.datePublished)} · {post.readingMinutes} min read · By {post.author}
      </div>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '1200 / 630', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-surface)', marginBottom: 28 }}>
        <Image
          src={post.coverImage}
          alt={post.coverAlt}
          fill
          priority
          sizes="(max-width: 760px) 100vw, 720px"
          style={{ objectFit: 'cover' }}
        />
      </div>

      <article>
        {post.body.map((block, i) => {
          if (block.type === 'heading') {
            return <h2 key={i} style={{ fontSize: 19, fontWeight: 800, margin: '28px 0 10px' }}>{block.text}</h2>
          }
          if (block.type === 'paragraph') {
            return (
              <p key={i} style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8, margin: '0 0 16px' }}>
                <Spans content={block.content} />
              </p>
            )
          }
          // image block
          return (
            <figure key={i} style={{ margin: '24px 0' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1200 / 630', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-surface)' }}>
                <Image src={block.src} alt={block.alt} fill sizes="(max-width: 760px) 100vw, 720px" style={{ objectFit: 'cover' }} />
              </div>
              {block.caption && (
                <figcaption style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 6, textAlign: 'center' }}>{block.caption}</figcaption>
              )}
            </figure>
          )
        })}
      </article>

      {post.faqs && post.faqs.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 12px' }}>Frequently asked questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {post.faqs.map((f, i) => (
              <div key={i}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>{f.question}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Closing internal-link CTA so every post points back into the site. */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '32px 0 0' }}>
        <Link href="/" style={{ padding: '11px 22px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 700, background: 'var(--green)', color: '#04130b' }}>
          View the outbreak map
        </Link>
        <Link href="/diseases" style={{ padding: '11px 22px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 700, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          Browse diseases
        </Link>
      </div>
    </main>
  )
}
