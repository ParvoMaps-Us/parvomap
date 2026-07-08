'use client'
import { useEffect, useRef } from 'react'

// Fire a GA4 event if gtag is loaded; no-op when analytics is blocked/absent.
function track(action: string, params?: Record<string, unknown>) {
  try {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
    gtag?.('event', action, { event_category: 'blog', ...params })
  } catch {
    /* analytics is best-effort */
  }
}

/**
 * Blog engagement tracking. GA4 already logs the pageview site-wide (root
 * layout's gtag). This adds the depth GA4 doesn't infer on its own:
 * - article_view: a labeled view with the slug/title (easier to segment than raw pageviews)
 * - scroll_depth: milestones at 25/50/75/100%
 * - article_read: fired once past ~90% (a real read, not a bounce)
 * Renders nothing.
 */
export default function BlogAnalytics({ slug, title }: { slug: string; title: string }) {
  const firedDepths = useRef<Set<number>>(new Set())
  const readFired = useRef(false)

  useEffect(() => {
    track('article_view', { article_slug: slug, article_title: title })

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      const pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100))

      for (const m of [25, 50, 75, 100]) {
        if (pct >= m && !firedDepths.current.has(m)) {
          firedDepths.current.add(m)
          track('scroll_depth', { article_slug: slug, percent: m })
        }
      }
      if (pct >= 90 && !readFired.current) {
        readFired.current = true
        track('article_read', { article_slug: slug, article_title: title })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // catch short posts already fully in view
    return () => window.removeEventListener('scroll', onScroll)
  }, [slug, title])

  return null
}
