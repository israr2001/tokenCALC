import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const today = new Date().toISOString().slice(0, 10)

function readEnv(key, fallback) {
  const file = resolve(root, '.env')
  if (!existsSync(file)) return fallback
  const match = readFileSync(file, 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'))
  return (match?.[1]?.trim() || fallback).replace(/\/$/, '')
}

const SITE = readEnv('VITE_SITE_URL', 'https://tools.example.com')

const modelsSrc = readFileSync(resolve(root, 'src/data/models.ts'), 'utf8')
const guidesSrc = readFileSync(resolve(root, 'src/content/guides.ts'), 'utf8')

const modelBlocks = [
  ...modelsSrc.matchAll(
    /\{[\s\S]*?id: '([^']+)'[\s\S]*?slug: '([^']+)'[\s\S]*?providerId: '([^']+)'[\s\S]*?\}/g,
  ),
]
const models = modelBlocks.map((m) => ({
  id: m[1],
  slug: m[2],
  providerId: m[3],
}))

const providers = [...new Set(models.map((m) => m.providerId))]
const guideSlugs = [...guidesSrc.matchAll(/slug: '([^']+)'/g)].map((m) => m[1])

const featured = [
  ['gpt-4-1', 'claude-sonnet-5'],
  ['gpt-5', 'claude-opus-4-8'],
  ['gemini-2-5-flash', 'gpt-4o-mini'],
  ['deepseek-v4-flash', 'gpt-4-1-nano'],
  ['claude-haiku-4-5', 'gemini-2-5-flash-lite'],
]

const paths = new Set([
  '/',
  '/tokenizer',
  '/cost-calculator',
  '/providers',
  '/tools/tokens-to-words',
  '/tools/batch-pricing',
  '/tools/cache-savings',
  '/changelog',
  '/guides',
  '/sitemap',
  '/embed',
])

for (const p of providers) paths.add(`/providers/${p}`)
for (const m of models) paths.add(`/providers/${m.providerId}/models/${m.slug}`)
for (const [a, b] of featured) paths.add(`/compare/${a}-vs-${b}`)
for (const g of guideSlugs) paths.add(`/guides/${g}`)

function abs(path) {
  return path === '/' ? `${SITE}/` : `${SITE}${path}`
}

const urls = [...paths]
  .sort()
  .map(
    (path) => `  <url>
    <loc>${abs(path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : path === '/embed' ? '0.3' : '0.7'}</priority>
  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

writeFileSync(resolve(root, 'public/sitemap.xml'), xml)

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`
writeFileSync(resolve(root, 'public/robots.txt'), robots)

console.log(`sitemap: ${paths.size} urls @ ${SITE}`)
