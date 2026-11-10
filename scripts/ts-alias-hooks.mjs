// Module hooks so a plain `node` (v22.18+/24, built-in type stripping) can import
// this repo's TypeScript: resolves the `@/` alias and extension-less TS paths.
// No install. Registered by scripts/ts-alias.mjs.
import { existsSync, statSync } from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const isFile = p => existsSync(p) && statSync(p).isFile()

export async function resolve(spec, ctx, next) {
  const s = spec.startsWith('@/') ? ROOT + spec.slice(2) : spec
  if (s.startsWith('/') || s.startsWith('.')) {
    const base = s.startsWith('.') ? fileURLToPath(new URL(s, ctx.parentURL)) : s
    for (const p of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
      if (isFile(p)) return next(pathToFileURL(p).href, ctx)
    }
  }
  return next(s, ctx)
}
