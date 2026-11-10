// Usage: node --import ./scripts/ts-alias.mjs scripts/<file>.ts
import { register } from 'node:module'
register('./ts-alias-hooks.mjs', import.meta.url)
