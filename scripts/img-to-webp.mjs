// Convert article images to WebP with sharp (bundled via Next.js).
// Usage:
//   node scripts/img-to-webp.mjs                 # convert every PNG/JPG in public/article-images
//   node scripts/img-to-webp.mjs path/to/img.png # convert one or more specific files
// Caps width at MAX_WIDTH (playbook: ~1280px) and encodes at QUALITY. Source files
// are left in place; remove them once the .webp references are wired up.
import sharp from 'sharp'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const DIR = 'public/article-images'
const MAX_WIDTH = 1280
const QUALITY = 82
const SRC_EXT = new Set(['.png', '.jpg', '.jpeg'])

const args = process.argv.slice(2)
const targets = args.length > 0
  ? args
  : (await readdir(DIR))
      .filter(f => SRC_EXT.has(path.extname(f).toLowerCase()))
      .map(f => path.join(DIR, f))

if (targets.length === 0) {
  console.log('No PNG/JPG files to convert.')
  process.exit(0)
}

for (const src of targets) {
  const out = src.replace(/\.(png|jpe?g)$/i, '.webp')
  const img = sharp(src)
  const { width } = await img.metadata()
  const pipeline = width && width > MAX_WIDTH ? img.resize({ width: MAX_WIDTH }) : img
  await pipeline.webp({ quality: QUALITY }).toFile(out)
  const [a, b] = await Promise.all([stat(src), stat(out)])
  const kb = n => Math.round(n / 1024)
  console.log(`${path.basename(src)} ${kb(a.size)}KB -> ${path.basename(out)} ${kb(b.size)}KB`)
}
