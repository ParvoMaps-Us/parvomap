# Blog Post Playbook (ParvoMaps)

How to write and publish a blog/article post on parvomaps.us. This is adapted
from the Scoopie blog process, but ParvoMaps is a **Next.js App Router** site
(not static HTML), so the mechanics are different. Read section 1 first.

---

## 1. Reality check: there is no blog system yet

As of this writing there is **no `app/blog` route and no post content source**.
Before the *first* post, decide on ONE approach and build it once:

- **Option A — MDX files (recommended for a low-volume blog):**
  `app/blog/[slug]/page.tsx` + content in `content/blog/<slug>.mdx`, read at build
  time. Good DX, content lives in git, easy images.
- **Option B — content array in `lib/`:** e.g. `lib/blog.ts` exporting a typed
  `BLOG_POSTS` array (slug, title, description, date, body, image). Matches how
  this repo already drives data (`lib/diseases.ts`, `lib/recalls.ts`), and plugs
  straight into `app/sitemap.ts` the same way disease/recall pages do.
- **Option C — a CMS/Redis-backed source:** only if posting becomes frequent.

Once the route + source exists, every subsequent post follows section 3.
**Recommendation: Option B** — it's consistent with this codebase and makes the
sitemap wiring (step 5) automatic.

---

## 2. Inputs before you start
- Final **post text** (headline + body).
- **Image(s)**, committed under `public/` (e.g. `public/blog/<slug>/cover.jpg`).
- Confirm current **facts** (what ParvoMaps does/claims) so nothing stale ships.

---

## 3. Per-post workflow (once the system from §1 exists)

### a. Create the content
- **Slug:** lowercase, hyphenated, keyword-rich.
- Add the post (MDX file *or* an entry in the `BLOG_POSTS` array).
- Body structure: lede, clear `<h2>` sections, one key callout, in-body image,
  a closing call-to-action.

### b. SEO metadata — use Next.js `generateMetadata`
In `app/blog/[slug]/page.tsx`, export `generateMetadata({ params })` returning:
- `title` (~50–60 chars, keyword first, `| ParvoMaps` suffix)
- `description` (~120–155 chars, keyword up front)
- `alternates.canonical` = `https://www.parvomaps.us/blog/<slug>`
- `openGraph` (type `article`, title, description, `url` = canonical, and an
  **`images`** entry pointing to a friendly 16:9 image)
- `twitter` card = `summary_large_image`

### c. Structured data (JSON-LD)
Render a `<script type="application/ld+json">` in the page with **`Article`** +
**`FAQPage`** (if the post has FAQs). Validate the JSON before shipping.

### d. Images
- **Compress before committing** — phone photos are 2–3 MB; resize to ~1280px
  wide (`sips -Z 1280 in.jpg --out out.jpg`) → ~200–350 KB. Prefer
  `next/image` for automatic optimization.
- Lead/share image = **friendly and clickable**; put any clinical/graphic image
  **in-body**, never as the hero or `og:image`.
- Every image needs descriptive **alt text** (<125 chars, keywords natural).

### e. Internal links — THE most important step here
ParvoMaps' biggest SEO problem has been **orphaned pages**. Every new post MUST:
- link **out** to relevant existing pages (`/diseases/<slug>`, `/outbreaks`,
  `/recalls`, the home map), AND
- be linked **in** from somewhere real (a blog index, the nav, or a related
  section on the pages it references). A post nothing links to is a new orphan.

### f. Sitemap & robots (dynamic — do NOT hand-edit XML)
- `app/sitemap.ts` is generated from data. If you used **Option B**, add a
  `blogPages` block that maps `BLOG_POSTS` to sitemap entries (copy the
  `diseasePages` pattern) and spread it into the returned array. New posts then
  appear automatically.
- `app/robots.ts` already exists; no per-post change needed.

### g. Validate before committing
- All JSON-LD blocks parse as valid JSON.
- `npm run build` succeeds (catches metadata/route errors).
- **No em dashes (—)** in copy (telltale AI sign; use commas/colons).
- Every referenced image exists and is compressed.
- The post links out AND is linked in (step e).

### h. Ship via branch + PR
```bash
git checkout -b blog-<slug>
git add .            # content, route, lib, sitemap.ts, public/ images
git commit -m "New blog post: <title>"
git push -u origin blog-<slug>
gh pr create --title "..." --body "..."   # if gh has access to ParvoMaps-Us
gh pr merge --merge --delete-branch
```
Merging to `main` triggers the Vercel deploy.

### i. After it's live — request indexing
1. Confirm the URL loads on the live domain.
2. **Google Search Console** → paste the full URL → **Request indexing**
   (faster than waiting on the sitemap for a newer site).
3. Re-submit the sitemap if you added a new content type.

---

## Quick checklist
Pick a system (§1, once) → write content → `generateMetadata` + JSON-LD →
compress images + alt text → **internal links in AND out** → wire `sitemap.ts`
→ validate (`npm run build`, JSON, no em-dashes) → branch + PR + merge →
request indexing.

> ParvoMaps note: the orphaned-pages issue means **internal linking is the step
> that matters most here** — more than on a site that's already well-connected.
